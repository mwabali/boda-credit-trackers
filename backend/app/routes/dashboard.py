from flask import Blueprint, jsonify
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.utils.auth import approved_access_required, get_account_company_name, resolve_request_account
from app.routes.transactions import serialize_transaction
from app.utils.rider_balances import get_outstanding_balance_map
from app.utils.station_company import hydrate_station
from models import Rider, Station, Transaction


dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


@dashboard_bp.get("")
@approved_access_required
def get_dashboard_payload():
    try:
        account = resolve_request_account()

        riders_query = Rider.query
        stations_query = Station.query
        transactions_query = Transaction.query.options(
            joinedload(Transaction.rider),
            joinedload(Transaction.station),
        )

        if account.role == "company":
            station_scope = (
                Station.company_id == account.company_id
                if account.company_id
                else Station.company_name == get_account_company_name(account)
            )
            riders_query = riders_query.filter(
                Rider.transactions.any(
                    Transaction.station.has(station_scope)
                )
            )
            stations_query = stations_query.filter(station_scope)
            transactions_query = transactions_query.join(Station).filter(station_scope)
        elif account.role == "station":
            riders_query = riders_query.filter(
                Rider.transactions.any(Transaction.station_id == account.station_id)
            )
            stations_query = stations_query.filter(Station.id == account.station_id)
            transactions_query = transactions_query.filter(
                Transaction.station_id == account.station_id
            )
        elif account.role == "rider":
            riders_query = riders_query.filter(Rider.id == account.rider_id)
            stations_query = stations_query.filter(
                Station.transactions.any(Transaction.rider_id == account.rider_id)
            )
            transactions_query = transactions_query.filter(
                Transaction.rider_id == account.rider_id
            )

        riders = riders_query.order_by(Rider.created_at.desc()).all()
        stations = stations_query.order_by(Station.created_at.desc()).all()
        transactions = transactions_query.order_by(Transaction.created_at.desc()).limit(5).all()

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

        stats_query = Transaction.query
        if account.role == "company":
            station_scope = (
                Station.company_id == account.company_id
                if account.company_id
                else Station.company_name == get_account_company_name(account)
            )
            stats_query = stats_query.join(Station).filter(station_scope)
        elif account.role == "station":
            stats_query = stats_query.filter(Transaction.station_id == account.station_id)
        elif account.role == "rider":
            stats_query = stats_query.filter(Transaction.rider_id == account.rider_id)

        stats = {
            "total": stats_query.count(),
            "pending": stats_query.filter(Transaction.status == "pending").count(),
            "paid": stats_query.filter(Transaction.status == "paid").count(),
        }

        return jsonify(
            {
                "success": True,
                "data": {
                    "viewerRole": account.role,
                    "riders": rider_data,
                    "stations": station_data,
                    "transactions": transaction_data,
                    "stats": stats,
                    "viewer": account.to_session_dict(),
                },
            }
        )
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


@dashboard_bp.get("/form-options")
@approved_access_required
def get_form_options():
    try:
        account = resolve_request_account()

        riders_query = Rider.query
        stations_query = Station.query

        if account.role == "company":
            station_scope = (
                Station.company_id == account.company_id
                if account.company_id
                else Station.company_name == get_account_company_name(account)
            )
            riders_query = riders_query.filter(
                Rider.transactions.any(
                    Transaction.station.has(station_scope)
                )
            )
            stations_query = stations_query.filter(station_scope)
        elif account.role == "station":
            stations_query = stations_query.filter(Station.id == account.station_id)
            riders_query = riders_query.filter(
                Rider.transactions.any(Transaction.station_id == account.station_id)
            )
        elif account.role == "rider":
            riders_query = riders_query.filter(Rider.id == account.rider_id)
            stations_query = stations_query.filter(Station.status == "active")

        riders = riders_query.order_by(Rider.created_at.desc()).all()
        stations = stations_query.order_by(Station.created_at.desc()).all()
        balance_map = get_outstanding_balance_map([rider.id for rider in riders])

        rider_data = []
        for rider in riders:
            payload = rider.to_dict()
            payload["currentBalance"] = balance_map.get(rider.id, 0)
            rider_data.append(payload)

        station_data = [hydrate_station(station) for station in stations]

        return jsonify(
            {
                "success": True,
                "data": {
                    "viewerRole": account.role,
                    "riders": rider_data,
                    "stations": station_data,
                },
            }
        )
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500
