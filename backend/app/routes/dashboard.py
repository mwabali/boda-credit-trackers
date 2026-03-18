from flask import Blueprint, jsonify
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from app.utils.auth import approved_access_required, get_account_company_name, resolve_request_account
from app.routes.transactions import serialize_transaction
from app.utils.rider_balances import get_outstanding_balance_map
from app.utils.station_company import hydrate_station
from models import Rider, Station, Transaction


dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/dashboard")


def build_transaction_analytics(transactions, stations=None):
    stations = stations or []
    total_amount = 0
    paid_amount = 0
    outstanding_amount = 0
    approved_count = 0
    paid_count = 0
    cancelled_count = 0

    per_station = {}

    for station in stations:
        station_id = station.id
        per_station[station_id] = {
            "id": station_id,
            "name": station.name,
            "displayName": hydrate_station(station)["displayName"],
            "status": station.status,
            "totalTransactions": 0,
            "totalAmount": 0,
            "outstandingAmount": 0,
            "paidAmount": 0,
            "pendingCount": 0,
            "approvedCount": 0,
            "paidCount": 0,
            "cancelledCount": 0,
            "activeRiders": set(),
        }

    for transaction in transactions:
        amount = float(transaction.amount or 0)
        total_amount += amount

        if transaction.status == "paid":
            paid_amount += amount
            paid_count += 1
        elif transaction.status in {"pending", "approved"}:
            outstanding_amount += amount

        if transaction.status == "approved":
            approved_count += 1
        elif transaction.status == "cancelled":
            cancelled_count += 1

        if transaction.station:
            station_id = transaction.station.id
            station_bucket = per_station.setdefault(
                station_id,
                {
                    "id": station_id,
                    "name": transaction.station.name,
                    "displayName": hydrate_station(transaction.station)["displayName"],
                    "status": transaction.station.status,
                    "totalTransactions": 0,
                    "totalAmount": 0,
                    "outstandingAmount": 0,
                    "paidAmount": 0,
                    "pendingCount": 0,
                    "approvedCount": 0,
                    "paidCount": 0,
                    "cancelledCount": 0,
                    "activeRiders": set(),
                },
            )
            station_bucket["totalTransactions"] += 1
            station_bucket["totalAmount"] += amount
            if transaction.status in {"pending", "approved"}:
                station_bucket["outstandingAmount"] += amount
            if transaction.status == "paid":
                station_bucket["paidAmount"] += amount
            if transaction.status == "pending":
                station_bucket["pendingCount"] += 1
            if transaction.status == "approved":
                station_bucket["approvedCount"] += 1
            if transaction.status == "paid":
                station_bucket["paidCount"] += 1
            if transaction.status == "cancelled":
                station_bucket["cancelledCount"] += 1
            if transaction.rider_id:
                station_bucket["activeRiders"].add(transaction.rider_id)

    total_count = len(transactions)
    actionable_count = total_count - cancelled_count
    approval_rate = ((approved_count + paid_count) / actionable_count * 100) if actionable_count else 0
    settlement_rate = (paid_count / actionable_count * 100) if actionable_count else 0

    station_performance = []
    for station_bucket in per_station.values():
        active_riders = len(station_bucket["activeRiders"])
        station_performance.append(
            {
                **station_bucket,
                "activeRiders": active_riders,
                "approvalRate": (
                    ((station_bucket["approvedCount"] + station_bucket["paidCount"])
                    / max(
                        1,
                        station_bucket["totalTransactions"] - station_bucket["cancelledCount"],
                    ))
                    * 100
                ),
                "recoveryRate": (
                    (station_bucket["paidCount"] / max(1, station_bucket["totalTransactions"]))
                    * 100
                ),
            }
        )

    station_performance.sort(key=lambda item: item["totalAmount"], reverse=True)

    return {
        "totalAmount": total_amount,
        "paidAmount": paid_amount,
        "outstandingAmount": outstanding_amount,
        "approvalRate": round(approval_rate, 1),
        "settlementRate": round(settlement_rate, 1),
        "stationPerformance": station_performance,
    }


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
        all_transactions = transactions_query.order_by(Transaction.created_at.desc()).all()
        transactions = all_transactions[:5]

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

        analytics = build_transaction_analytics(all_transactions, stations)
        analytics["suspendedRiders"] = sum(1 for rider in riders if rider.status == "suspended")
        analytics["inactiveRiders"] = sum(1 for rider in riders if rider.status == "inactive")
        analytics["activeStations"] = sum(1 for station in stations if station.status == "active")

        return jsonify(
            {
                "success": True,
                "data": {
                    "viewerRole": account.role,
                    "riders": rider_data,
                    "stations": station_data,
                    "transactions": transaction_data,
                    "stats": stats,
                    "analytics": analytics,
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
