from flask import Blueprint, jsonify
from sqlalchemy.orm import joinedload

from app.routes.transactions import serialize_transaction
from app.utils.rider_balances import get_outstanding_balance_map
from app.utils.station_company import hydrate_station
from models import Rider, Station, Transaction


dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@dashboard_bp.get("")
def get_dashboard_payload():
    try:
        riders = Rider.query.order_by(Rider.created_at.desc()).all()
        stations = Station.query.order_by(Station.created_at.desc()).all()
        transactions = (
            Transaction.query.options(
                joinedload(Transaction.rider),
                joinedload(Transaction.station),
            )
            .order_by(Transaction.created_at.desc())
            .limit(5)
            .all()
        )

        balance_map = get_outstanding_balance_map([rider.id for rider in riders])

        rider_data = []
        for rider in riders:
            payload = rider.to_dict()
            payload["currentBalance"] = balance_map.get(rider.id, 0)
            rider_data.append(payload)

        station_data = [hydrate_station(station) for station in stations]
        transaction_data = [
            serialize_transaction(transaction, include_all=True)
            for transaction in transactions
        ]

        stats = {
            "total": Transaction.query.count(),
            "pending": Transaction.query.filter_by(status="pending").count(),
            "paid": Transaction.query.filter_by(status="paid").count(),
        }

        return jsonify(
            {
                "success": True,
                "data": {
                    "riders": rider_data,
                    "stations": station_data,
                    "transactions": transaction_data,
                    "stats": stats,
                },
            }
        )
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500
