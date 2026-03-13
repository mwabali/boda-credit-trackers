from sqlalchemy import func

from app.database.db import db
from models import Rider, Transaction


OUTSTANDING_TRANSACTION_STATUSES = {"pending", "approved"}


def get_outstanding_balance_map(rider_ids=None):
    rider_ids = rider_ids or []

    if not rider_ids:
        return {}

    rows = (
        db.session.query(
            Transaction.rider_id.label("rider_id"),
            func.coalesce(func.sum(Transaction.amount), 0).label("balance"),
        )
        .filter(Transaction.rider_id.in_(rider_ids))
        .filter(Transaction.status.in_(OUTSTANDING_TRANSACTION_STATUSES))
        .group_by(Transaction.rider_id)
        .all()
    )

    return {row.rider_id: float(row.balance or 0) for row in rows}


def sync_rider_balance(rider_id):
    balance = get_outstanding_balance_map([rider_id]).get(rider_id, 0)
    rider = Rider.query.get(rider_id)

    if rider:
        rider.current_balance = balance
        db.session.commit()

    return balance
