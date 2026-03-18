from flask import Blueprint, jsonify, request

from app.utils.auth import auth_required, generate_auth_token, resolve_request_account
from models import AuthAccount


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.post("/login")
def login():
    try:
        payload = request.get_json() or {}
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password") or ""

        if not email or not password:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Email and password are required",
                    }
                ),
                400,
            )

        account = AuthAccount.query.filter_by(email=email).first()
        if not account or not account.check_password(password):
            return jsonify({"success": False, "message": "Invalid credentials"}), 401

        if not account.is_active:
            return jsonify({"success": False, "message": "Account is inactive"}), 403

        return jsonify(
            {
                "success": True,
                "token": generate_auth_token(account),
                "data": account.to_session_dict(),
            }
        )
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


@auth_bp.get("/me")
@auth_required
def current_account():
    account = resolve_request_account()
    return jsonify({"success": True, "data": account.to_session_dict()})


@auth_bp.post("/logout")
def logout():
    return jsonify({"success": True, "message": "Signed out"})
