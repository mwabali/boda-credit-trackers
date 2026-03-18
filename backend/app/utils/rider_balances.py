from sqlalchemy import func

from app.database.db import db
from models import Rider, Station, Transaction


OUTSTANDING_TRANSACTION_STATUSES = {"pending", "approved"}


def get_outstanding_balance_map(
    rider_ids=None,
    company_id=None,
    company_name=None,
    station_id=None,
):
    rider_ids = rider_ids or []

    if not rider_ids:
        return {}

    query = (
        db.session.query(
            Transaction.rider_id.label("rider_id"),
            func.coalesce(func.sum(Transaction.amount), 0).label("balance"),
        )
        .filter(Transaction.rider_id.in_(rider_ids))
        .filter(Transaction.status.in_(OUTSTANDING_TRANSACTION_STATUSES))
    )

    if company_id or company_name:
        query = query.join(Station, Station.id == Transaction.station_id)
        if company_id:
            query = query.filter(Station.company_id == company_id)
        elif company_name:
            query = query.filter(Station.company_name == company_name)

    if station_id:
        query = query.filter(Transaction.station_id == station_id)

    rows = query.group_by(Transaction.rider_id).all()

    return {row.rider_id: float(row.balance or 0) for row in rows}


def sync_rider_balance(rider_id):
    balance = get_outstanding_balance_map([rider_id]).get(rider_id, 0)
    rider = Rider.query.get(rider_id)

    if rider:
        rider.current_balance = balance
        db.session.commit()

    return balance
