from flask import Blueprint, jsonify, request
from sqlalchemy.orm import joinedload

from app.database.db import db
from app.utils.rider_balances import sync_rider_balance
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
            }
        if transaction.station:
            payload["station"] = hydrate_station(transaction.station)

    return payload


@transactions_bp.get("/stats/dashboard")
def transaction_dashboard_stats():
    try:
        total_count = Transaction.query.count()
        pending_count = Transaction.query.filter_by(status="pending").count()
        paid_count = Transaction.query.filter_by(status="paid").count()

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
def list_transactions():
    try:
        status = request.args.get("status", "").strip()
        include_all = request.args.get("include") == "all"

        query = Transaction.query
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

        return jsonify({"success": True, "count": len(data), "data": data})
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


@transactions_bp.post("")
def create_transaction():
    try:
        payload = request.get_json() or {}
        rider_id = payload.get("riderId")
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

        transaction = Transaction(
            rider_id=rider_id,
            station_id=station_id,
            amount=amount,
            liters=payload.get("liters"),
            notes=payload.get("notes"),
        )
        db.session.add(transaction)
        db.session.commit()
        sync_rider_balance(rider_id)

        return jsonify({"success": True, "data": transaction.to_dict()}), 201
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500


@transactions_bp.patch("/<int:transaction_id>")
def patch_transaction_status(transaction_id):
    try:
        transaction = Transaction.query.get(transaction_id)

        if not transaction:
            return jsonify({"success": False, "message": "Not found"}), 404

        status = (request.get_json() or {}).get("status")
        if status not in VALID_TRANSACTION_STATUSES:
            return (
                jsonify({"success": False, "message": "Invalid transaction status"}),
                400,
            )

        transaction.status = status
        db.session.commit()
        sync_rider_balance(transaction.rider_id)

        return jsonify({"success": True, "data": transaction.to_dict()})
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500


@transactions_bp.delete("/<int:transaction_id>")
def delete_transaction(transaction_id):
    try:
        transaction = Transaction.query.get(transaction_id)

        if not transaction:
            return jsonify({"success": False, "message": "Not found"}), 404

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
