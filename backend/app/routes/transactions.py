from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from app.database.db import db
from app.utils.auth import approved_access_required, get_account_company_name, resolve_request_account, roles_required
from app.utils.db_errors import format_integrity_error
from app.utils.notifications import create_notification
from app.utils.rider_balances import sync_rider_balance
from app.utils.sms import queue_sms_alert
from app.utils.station_company import hydrate_station
from models import Rider, Station, Transaction


transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")

VALID_TRANSACTION_STATUSES = {"pending", "approved", "paid", "cancelled"}


def serialize_transaction(transaction, include_all=False):
    payload = transaction.to_dict()

    if include_all:
        if transaction.rider:
            payload["rider"] = {
                "id": transaction.rider.id,
                "name": transaction.rider.name,
                "phone": transaction.rider.phone,
                "licensePlate": transaction.rider.license_plate,
                "sacco": (
                    transaction.rider.sacco.to_dict()
                    if transaction.rider.sacco
                    else None
                ),
            }
        if transaction.station:
            payload["station"] = hydrate_station(transaction.station)

    return payload


@transactions_bp.get("/stats/dashboard")
@approved_access_required
def transaction_dashboard_stats():
    try:
        account = resolve_request_account()
        query = Transaction.query

        if account.role == "company":
            station_scope = (
                Station.company_id == account.company_id
                if account.company_id
                else Station.company_name == get_account_company_name(account)
            )
            query = query.join(Station).filter(station_scope)
        elif account.role == "sacco":
            query = query.join(Rider).filter(Rider.sacco_id == account.sacco_id)
        elif account.role == "station":
            query = query.filter_by(station_id=account.station_id)
        elif account.role == "rider":
            query = query.filter_by(rider_id=account.rider_id)

        total_count = query.count()
        pending_count = query.filter(Transaction.status == "pending").count()
        paid_count = query.filter(Transaction.status == "paid").count()

        return jsonify(
            {
                "success": True,
                "data": {
                    "total": total_count,
                    "pending": pending_count,
                    "paid": paid_count,
                },
            }
        )
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


@transactions_bp.get("")
@approved_access_required
def list_transactions():
    try:
        account = resolve_request_account()
        status = request.args.get("status", "").strip()
        include_all = request.args.get("include") == "all"
        include_stats = request.args.get("stats") == "dashboard"

        query = Transaction.query
        if account.role == "company":
            station_scope = (
                Station.company_id == account.company_id
                if account.company_id
                else Station.company_name == get_account_company_name(account)
            )
            query = query.join(Station).filter(station_scope)
        elif account.role == "sacco":
            query = query.join(Rider).filter(Rider.sacco_id == account.sacco_id)
        elif account.role == "station":
            query = query.filter(Transaction.station_id == account.station_id)
        elif account.role == "rider":
            query = query.filter(Transaction.rider_id == account.rider_id)

        if status:
            query = query.filter(Transaction.status == status)

        if include_all:
            query = query.options(
                joinedload(Transaction.rider),
                joinedload(Transaction.station),
            )

        transactions = query.order_by(Transaction.created_at.desc()).all()
        data = [
            serialize_transaction(transaction, include_all=include_all)
            for transaction in transactions
        ]

        response_payload = {"success": True, "count": len(data), "data": data}

        if include_stats:
            stats_query = Transaction.query
            if account.role == "company":
                station_scope = (
                    Station.company_id == account.company_id
                    if account.company_id
                    else Station.company_name == get_account_company_name(account)
                )
                stats_query = stats_query.join(Station).filter(station_scope)
            elif account.role == "sacco":
                stats_query = stats_query.join(Rider).filter(Rider.sacco_id == account.sacco_id)
            elif account.role == "station":
                stats_query = stats_query.filter(Transaction.station_id == account.station_id)
            elif account.role == "rider":
                stats_query = stats_query.filter(Transaction.rider_id == account.rider_id)

            response_payload["stats"] = {
                "total": stats_query.count(),
                "pending": stats_query.filter(Transaction.status == "pending").count(),
                "paid": stats_query.filter(Transaction.status == "paid").count(),
            }

        return jsonify(response_payload)
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


@transactions_bp.post("")
@roles_required("rider")
def create_transaction():
    try:
        account = resolve_request_account()
        payload = request.get_json() or {}
        rider_id = account.rider_id
        station_id = payload.get("stationId")
        amount = payload.get("amount")

        if not rider_id or not station_id or not amount:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        rider = Rider.query.get(rider_id)
        station = Station.query.get(station_id)

        if not rider or not station:
            return (
                jsonify({"success": False, "message": "Rider or station not found"}),
                404,
            )

        if rider.status != "active":
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Your rider account is not currently allowed to request credit",
                    }
                ),
                403,
            )

        if station.status != "active":
            return jsonify({"success": False, "message": "Selected station is not active"}), 403

        transaction = Transaction(
            rider_id=rider_id,
            station_id=station_id,
            amount=amount,
            liters=payload.get("liters"),
            notes=payload.get("notes"),
            status="pending",
        )
        db.session.add(transaction)
        db.session.flush()
        queue_sms_alert(
            rider.phone,
            f"BodaCredit: Your fuel credit request of Ksh {float(transaction.amount):,.0f} at {hydrate_station(station)['displayName']} is awaiting review.",
            rider_id=rider.id,
            transaction_id=transaction.id,
        )

        station_manager_account = getattr(station, "account", None)
        if station_manager_account and station_manager_account.is_active:
            create_notification(
                station_manager_account.id,
                "New credit request awaiting review",
                f"{rider.name} submitted a fuel credit request for {hydrate_station(station)['displayName']}.",
                notification_type="approval",
                action_path="/transactions",
            )

        db.session.commit()
        sync_rider_balance(rider_id)

        return jsonify({"success": True, "data": transaction.to_dict()}), 201
    except ValueError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 400
    except IntegrityError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": format_integrity_error(error)}), 409
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500


@transactions_bp.patch("/<int:transaction_id>")
@roles_required("station")
def patch_transaction_status(transaction_id):
    try:
        account = resolve_request_account()
        transaction = Transaction.query.get(transaction_id)

        if not transaction:
            return jsonify({"success": False, "message": "Not found"}), 404

        if account.role == "station" and transaction.station_id != account.station_id:
            return jsonify({"success": False, "message": "Access denied"}), 403

        status = (request.get_json() or {}).get("status")
        if status not in VALID_TRANSACTION_STATUSES:
            return (
                jsonify({"success": False, "message": "Invalid transaction status"}),
                400,
            )

        previous_status = transaction.status
        transaction.status = status
        if previous_status != status and transaction.rider:
            queue_sms_alert(
                transaction.rider.phone,
                f"BodaCredit: Your fuel credit request of Ksh {float(transaction.amount):,.0f} is now {status}.",
                rider_id=transaction.rider_id,
                transaction_id=transaction.id,
            )

        rider_account = getattr(transaction.rider, "account", None) if transaction.rider else None
        if rider_account and rider_account.is_active and previous_status != status:
            station_display_name = (
                hydrate_station(transaction.station)["displayName"]
                if transaction.station
                else "your selected station"
            )

            if status == "approved":
                create_notification(
                    rider_account.id,
                    "Credit request approved",
                    f"Your fuel credit request at {station_display_name} has been approved and is ready for fulfilment.",
                    notification_type="success",
                    action_path="/transactions",
                )
            elif status == "cancelled":
                create_notification(
                    rider_account.id,
                    "Credit request declined",
                    f"Your fuel credit request at {station_display_name} was declined. Please review the request details or contact the station.",
                    notification_type="warning",
                    action_path="/transactions",
                )
            elif status == "paid":
                create_notification(
                    rider_account.id,
                    "Credit request settled",
                    f"Your fuel credit request at {station_display_name} has been marked as paid.",
                    notification_type="success",
                    action_path="/transactions",
                )

        db.session.commit()
        sync_rider_balance(transaction.rider_id)

        return jsonify({"success": True, "data": transaction.to_dict()})
    except ValueError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 400
    except IntegrityError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": format_integrity_error(error)}), 409
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500


@transactions_bp.delete("/<int:transaction_id>")
@roles_required("station")
def delete_transaction(transaction_id):
    try:
        account = resolve_request_account()
        transaction = Transaction.query.get(transaction_id)

        if not transaction:
            return jsonify({"success": False, "message": "Not found"}), 404

        if account.role == "station" and transaction.station_id != account.station_id:
            return jsonify({"success": False, "message": "Access denied"}), 403

        rider_id = transaction.rider_id
        db.session.delete(transaction)
        db.session.commit()
        sync_rider_balance(rider_id)

        return jsonify(
            {"success": True, "message": "Transaction deleted successfully"}
        )
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500
