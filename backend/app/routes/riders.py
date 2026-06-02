from flask import Blueprint, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from app.database.db import db
from app.utils.auth import approved_access_required, get_account_company_name, resolve_request_account, roles_required
from app.utils.db_errors import format_integrity_error
from app.utils.rider_balances import get_outstanding_balance_map
from models import Rider, Station, Transaction


riders_bp = Blueprint("riders", __name__, url_prefix="/riders")

VALID_RIDER_STATUSES = {"active", "suspended", "inactive"}


@riders_bp.get("")
@approved_access_required
def list_riders():
    try:
        account = resolve_request_account()
        search = request.args.get("search", "").strip().lower()
        status = request.args.get("status", "").strip()

        query = Rider.query

        if account.role == "company":
            station_scope = (
                Station.company_id == account.company_id
                if account.company_id
                else Station.company_name == get_account_company_name(account)
            )
        elif account.role == "sacco":
            query = query.filter(Rider.sacco_id == account.sacco_id)
        elif account.role == "station":
            query = query.filter(
                Rider.transactions.any(Transaction.station_id == account.station_id)
            )
        elif account.role == "rider":
            query = query.filter(Rider.id == account.rider_id)

        if status:
            query = query.filter(Rider.status == status)

        if search:
            query = query.filter(func.lower(Rider.name).like(f"%{search}%"))

        riders = query.order_by(Rider.created_at.desc()).all()
        balance_kwargs = {}
        if account.role == "company":
            balance_kwargs = {
                "company_id": account.company_id,
                "company_name": get_account_company_name(account),
            }
        elif account.role == "station":
            balance_kwargs = {"station_id": account.station_id}

        balance_map = get_outstanding_balance_map(
            [rider.id for rider in riders],
            **balance_kwargs,
        )

        data = []
        for rider in riders:
            rider_data = rider.to_dict()
            rider_data["currentBalance"] = balance_map.get(rider.id, 0)
            data.append(rider_data)

        return jsonify({"success": True, "count": len(data), "data": data})
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


@riders_bp.get("/<int:rider_id>")
@approved_access_required
def get_rider(rider_id):
    try:
        account = resolve_request_account()
        rider = (
            Rider.query.options(joinedload(Rider.transactions))
            .filter(Rider.id == rider_id)
            .first()
        )

        if not rider:
            return jsonify({"success": False, "message": "Rider not found"}), 404

        if account.role == "company":
            has_company_transaction = any(
                transaction.station
                and (
                    (account.company_id and transaction.station.company_id == account.company_id)
                    or (
                        not account.company_id
                        and transaction.station.company_name == get_account_company_name(account)
                    )
                )
                for transaction in rider.transactions
            )
            if not has_company_transaction:
                return jsonify({"success": False, "message": "Access denied"}), 403

        if account.role == "sacco" and rider.sacco_id != account.sacco_id:
            return jsonify({"success": False, "message": "Access denied"}), 403

        if account.role == "rider" and account.rider_id != rider_id:
            return jsonify({"success": False, "message": "Access denied"}), 403

        if account.role == "station":
            has_station_transaction = any(
                transaction.station_id == account.station_id for transaction in rider.transactions
            )
            if not has_station_transaction:
                return jsonify({"success": False, "message": "Access denied"}), 403

        relevant_transactions = rider.transactions
        if account.role == "company":
            relevant_transactions = [
                transaction
                for transaction in rider.transactions
                if transaction.station
                and (
                    (account.company_id and transaction.station.company_id == account.company_id)
                    or (
                        not account.company_id
                        and transaction.station.company_name == get_account_company_name(account)
                    )
                )
            ]
        elif account.role == "station":
            relevant_transactions = [
                transaction
                for transaction in rider.transactions
                if transaction.station_id == account.station_id
            ]

        outstanding_balance = sum(
            float(transaction.amount or 0)
            for transaction in relevant_transactions
            if transaction.status not in {"paid", "cancelled"}
        )
        total_transactions = len(relevant_transactions)
        total_spent = sum(float(transaction.amount or 0) for transaction in relevant_transactions)

        rider_data = rider.to_dict()
        rider_data["currentBalance"] = outstanding_balance
        rider_data["transactions"] = [
            transaction.to_dict() for transaction in sorted(
                relevant_transactions,
                key=lambda item: item.created_at or 0,
                reverse=True,
            )[:10]
        ]
        rider_data["stats"] = {
            "totalTransactions": total_transactions,
            "totalSpent": total_spent,
        }

        return jsonify({"success": True, "data": rider_data})
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


@riders_bp.post("")
@roles_required("company", "station", "sacco")
def create_rider():
    try:
        payload = request.get_json() or {}
        name = (payload.get("name") or "").strip()
        phone = (payload.get("phone") or "").strip()
        license_plate = (payload.get("licensePlate") or "").strip()

        if not name or not phone or not license_plate:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Name, phone, and licensePlate are required",
                    }
                ),
                400,
            )

        account = resolve_request_account()
        sacco_id = payload.get("saccoId") or payload.get("sacco_id")
        if account.role == "sacco":
            sacco_id = account.sacco_id

        rider = Rider(name=name, phone=phone, license_plate=license_plate, sacco_id=sacco_id)
        db.session.add(rider)
        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Rider created successfully",
                    "data": rider.to_dict(),
                }
            ),
            201,
        )
    except ValueError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 400
    except IntegrityError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": format_integrity_error(error)}), 409
    except ValueError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 400
    except IntegrityError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": format_integrity_error(error)}), 409
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500


@riders_bp.patch("/<int:rider_id>")
@roles_required("station")
def patch_rider_status(rider_id):
    try:
        account = resolve_request_account()
        rider = Rider.query.get(rider_id)

        if not rider:
            return jsonify({"success": False, "message": "Rider not found"}), 404

        status = (request.get_json() or {}).get("status")
        if status not in VALID_RIDER_STATUSES:
            return jsonify({"success": False, "message": "Invalid rider status"}), 400

        has_station_transaction = Rider.query.filter(
            Rider.id == rider_id,
            Rider.transactions.any(Transaction.station_id == account.station_id),
        ).first()

        if not has_station_transaction:
            return jsonify({"success": False, "message": "Access denied"}), 403

        rider.status = status
        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Rider status updated",
                "data": rider.to_dict(),
            }
        )
    except ValueError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 400
    except IntegrityError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": format_integrity_error(error)}), 409
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500


@riders_bp.put("/<int:rider_id>")
@roles_required("company")
def update_rider(rider_id):
    try:
        rider = Rider.query.get(rider_id)

        if not rider:
            return jsonify({"success": False, "message": "Rider not found"}), 404

        payload = request.get_json() or {}
        status = payload.get("status", rider.status)

        if status and status not in VALID_RIDER_STATUSES:
            return jsonify({"success": False, "message": "Invalid rider status"}), 400

        rider.name = (payload.get("name") or rider.name).strip()
        rider.phone = (payload.get("phone") or rider.phone).strip()
        rider.license_plate = (payload.get("licensePlate") or rider.license_plate).strip()
        rider.status = status
        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Rider updated",
                "data": rider.to_dict(),
            }
        )
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500
