from flask import Blueprint, jsonify
from sqlalchemy.orm import joinedload

from app.utils.auth import approved_access_required, resolve_request_account, roles_required
from app.utils.rider_balances import get_outstanding_balance_map
from app.routes.transactions import serialize_transaction
from models import Rider, Sacco, Transaction


saccos_bp = Blueprint("saccos", __name__, url_prefix="/saccos")


def build_sacco_payload(sacco):
    riders = Rider.query.filter(Rider.sacco_id == sacco.id).order_by(Rider.created_at.desc()).all()
    rider_ids = [rider.id for rider in riders]
    balance_map = get_outstanding_balance_map(rider_ids)
    transactions = (
        Transaction.query.options(
            joinedload(Transaction.rider),
            joinedload(Transaction.station),
        )
        .filter(Transaction.rider_id.in_(rider_ids))
        .order_by(Transaction.created_at.desc())
        .all()
        if rider_ids
        else []
    )

    outstanding_amount = sum(
        float(transaction.amount or 0)
        for transaction in transactions
        if transaction.status in {"pending", "approved"}
    )
    paid_amount = sum(
        float(transaction.amount or 0)
        for transaction in transactions
        if transaction.status == "paid"
    )

    rider_data = []
    for rider in riders:
        payload = rider.to_dict()
        payload["currentBalance"] = balance_map.get(rider.id, 0)
        rider_data.append(payload)

    return {
        **sacco.to_dict(),
        "stats": {
            "riders": len(riders),
            "activeRiders": sum(1 for rider in riders if rider.status == "active"),
            "transactions": len(transactions),
            "outstandingAmount": outstanding_amount,
            "paidAmount": paid_amount,
        },
        "riders": rider_data,
        "transactions": [
            serialize_transaction(transaction, include_all=True)
            for transaction in transactions[:10]
        ],
    }


@saccos_bp.get("")
@approved_access_required
def list_saccos():
    account = resolve_request_account()
    query = Sacco.query
    if account.role == "sacco":
        query = query.filter(Sacco.id == account.sacco_id)

    saccos = query.order_by(Sacco.name.asc()).all()
    return jsonify({"success": True, "data": [build_sacco_payload(sacco) for sacco in saccos]})


@saccos_bp.get("/me")
@roles_required("sacco")
def get_my_sacco():
    account = resolve_request_account()
    sacco = Sacco.query.get(account.sacco_id)
    if not sacco:
        return jsonify({"success": False, "message": "SACCO profile not found"}), 404
    return jsonify({"success": True, "data": build_sacco_payload(sacco)})
