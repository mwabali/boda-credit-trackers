from flask import Blueprint, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from app.database.db import db
from app.utils.db_errors import format_integrity_error
from app.utils.rider_balances import get_outstanding_balance_map
from models import Rider, Transaction


riders_bp = Blueprint("riders", __name__, url_prefix="/riders")

VALID_RIDER_STATUSES = {"active", "suspended", "inactive"}


@riders_bp.get("")
def list_riders():
    try:
        search = request.args.get("search", "").strip().lower()
        status = request.args.get("status", "").strip()

        query = Rider.query

        if status:
            query = query.filter(Rider.status == status)

        if search:
            query = query.filter(func.lower(Rider.name).like(f"%{search}%"))

        riders = query.order_by(Rider.created_at.desc()).all()
        balance_map = get_outstanding_balance_map([rider.id for rider in riders])

        data = []
        for rider in riders:
            rider_data = rider.to_dict()
            rider_data["currentBalance"] = balance_map.get(rider.id, 0)
            data.append(rider_data)

        return jsonify({"success": True, "count": len(data), "data": data})
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


@riders_bp.get("/<int:rider_id>")
def get_rider(rider_id):
    try:
        rider = (
            Rider.query.options(joinedload(Rider.transactions))
            .filter(Rider.id == rider_id)
            .first()
        )

        if not rider:
            return jsonify({"success": False, "message": "Rider not found"}), 404

        outstanding_balance = sum(
            float(transaction.amount or 0)
            for transaction in rider.transactions
            if transaction.status not in {"paid", "cancelled"}
        )
        total_transactions = len(rider.transactions)
        total_spent = sum(float(transaction.amount or 0) for transaction in rider.transactions)

        rider_data = rider.to_dict()
        rider_data["currentBalance"] = outstanding_balance
        rider_data["transactions"] = [
            transaction.to_dict() for transaction in sorted(
                rider.transactions,
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

        rider = Rider(name=name, phone=phone, license_plate=license_plate)
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
def patch_rider_status(rider_id):
    try:
        rider = Rider.query.get(rider_id)

        if not rider:
            return jsonify({"success": False, "message": "Rider not found"}), 404

        status = (request.get_json() or {}).get("status")
        if status not in VALID_RIDER_STATUSES:
            return jsonify({"success": False, "message": "Invalid rider status"}), 400

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
