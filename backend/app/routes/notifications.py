from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from app.database.db import db
from app.utils.auth import (
    auth_required,
    get_account_company_name,
    resolve_request_account,
    roles_required,
    station_belongs_to_account_company,
)
from app.utils.notifications import create_notification, notify_company_accounts_once
from models import AuthAccount, Notification, Station, Transaction, current_timestamp


notifications_bp = Blueprint("notifications", __name__, url_prefix="/notifications")

QUIET_STATION_LOOKBACK_DAYS = 7
HIGH_PENDING_EXPOSURE_THRESHOLD = 5000


def emit_company_health_notifications(account):
    company_name = get_account_company_name(account)
    station_query = Station.query

    if account.company_id:
        station_query = station_query.filter(Station.company_id == account.company_id)
    else:
        station_query = station_query.filter(Station.company_name == company_name)

    stations = station_query.order_by(Station.created_at.desc()).all()
    if not stations:
        return

    station_ids = [station.id for station in stations]
    recent_cutoff = (datetime.utcnow() - timedelta(days=QUIET_STATION_LOOKBACK_DAYS)).isoformat()

    recent_transactions = (
        Transaction.query.options(joinedload(Transaction.station))
        .filter(Transaction.station_id.in_(station_ids), Transaction.created_at >= recent_cutoff)
        .all()
    )

    transactions_by_station = {station_id: [] for station_id in station_ids}
    for transaction in recent_transactions:
        transactions_by_station.setdefault(transaction.station_id, []).append(transaction)

    for station in stations:
        station_transactions = transactions_by_station.get(station.id, [])
        station_display_name = station.to_dict().get("displayName") or f"{station.company_name} {station.name}".strip()

        if station.status == "active" and not station_transactions:
            notify_company_accounts_once(
                company_id=account.company_id,
                company_name=company_name,
                title="Station activity has gone quiet",
                message=f"{station_display_name} has not recorded a credit request in the last {QUIET_STATION_LOOKBACK_DAYS} days.",
                notification_type="warning",
                action_path="/stations",
                dedupe_hours=24,
            )

        pending_exposure = sum(
            float(transaction.amount or 0)
            for transaction in station_transactions
            if transaction.status in {"pending", "approved"}
        )
        pending_count = sum(
            1
            for transaction in station_transactions
            if transaction.status in {"pending", "approved"}
        )

        if pending_exposure >= HIGH_PENDING_EXPOSURE_THRESHOLD or pending_count >= 3:
            notify_company_accounts_once(
                company_id=account.company_id,
                company_name=company_name,
                title="Station pending exposure is rising",
                message=(
                    f"{station_display_name} is carrying {pending_count} unsettled requests worth "
                    f"Ksh {int(round(pending_exposure)):,}. Review station activity for follow-up."
                ),
                notification_type="approval",
                action_path="/transactions",
                dedupe_hours=12,
            )


@notifications_bp.get("")
@auth_required
def list_notifications():
    try:
        account = resolve_request_account()
        if account.role == "company":
            emit_company_health_notifications(account)
            db.session.commit()

        notifications = (
            Notification.query.filter(
                Notification.recipient_account_id == account.id,
                Notification.created_at >= account.created_at,
            )
            .order_by(Notification.created_at.desc())
            .all()
        )

        payload = {
            "notifications": [notification.to_dict() for notification in notifications],
        }

        if account.role == "company":
            pending_query = AuthAccount.query.filter_by(
                role="station",
                approval_status="pending",
                is_active=True,
            )
            if account.company_id and get_account_company_name(account):
                pending_query = pending_query.filter(
                    or_(
                        AuthAccount.company_id == account.company_id,
                        AuthAccount.company_name == get_account_company_name(account),
                    )
                )
            elif account.company_id:
                pending_query = pending_query.filter(AuthAccount.company_id == account.company_id)
            else:
                pending_query = pending_query.filter(
                    AuthAccount.company_name == get_account_company_name(account)
                )

            pending_accounts = pending_query.order_by(AuthAccount.created_at.desc()).all()

            payload["pendingStationApprovals"] = [
                {
                    "id": pending_account.id,
                    "fullName": pending_account.full_name,
                    "email": pending_account.email,
                    "companyName": pending_account.company.name if pending_account.company else pending_account.company_name,
                    "station": pending_account.station.to_dict() if pending_account.station else None,
                    "created_at": pending_account.created_at,
                }
                for pending_account in pending_accounts
            ]

        return jsonify({"success": True, "data": payload})
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


@notifications_bp.patch("/<int:notification_id>/read")
@auth_required
def mark_notification_read(notification_id):
    try:
        account = resolve_request_account()
        notification = Notification.query.get(notification_id)

        if not notification or notification.recipient_account_id != account.id:
            return jsonify({"success": False, "message": "Notification not found"}), 404

        notification.is_read = True
        db.session.commit()

        return jsonify({"success": True, "data": notification.to_dict()})
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500


@notifications_bp.patch("/station-approvals/<int:account_id>")
@roles_required("company")
def review_station_account(account_id):
    try:
        reviewer = resolve_request_account()
        payload = request.get_json() or {}
        decision = (payload.get("decision") or "").strip().lower()

        if decision not in {"approved", "rejected"}:
            return jsonify({"success": False, "message": "Decision must be approved or rejected"}), 400

        station_account = AuthAccount.query.get(account_id)
        if not station_account or station_account.role != "station":
            return jsonify({"success": False, "message": "Station account not found"}), 404

        if not station_belongs_to_account_company(reviewer, station_account.station):
            return jsonify({"success": False, "message": "Access denied"}), 403

        station_account.approval_status = decision
        station_account.approved_at = current_timestamp()
        station_account.approved_by_account_id = reviewer.id

        if decision == "approved":
            if station_account.station:
                station_account.station.manager_name = station_account.full_name
            create_notification(
                station_account.id,
                "Station access approved",
                "Your station manager account has been approved. You can now access station data.",
                notification_type="success",
                action_path="/stations",
            )
        else:
            create_notification(
                station_account.id,
                "Station access update",
                "Your station manager account request was declined. Please contact your company administrator.",
                notification_type="warning",
                action_path="/notifications",
            )

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": f"Station account {decision}",
                "data": station_account.to_session_dict(),
            }
        )
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500
