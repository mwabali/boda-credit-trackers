from functools import wraps

from flask import current_app, g, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from models import AuthAccount


def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"], salt="auth-token")


def generate_auth_token(account):
    return _serializer().dumps({"account_id": account.id})


def resolve_request_account():
    if getattr(g, "current_account", None) is not None:
        return g.current_account

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        g.current_account = None
        return None

    token = auth_header.replace("Bearer ", "", 1).strip()
    if not token:
        g.current_account = None
        return None

    try:
        payload = _serializer().loads(
            token, max_age=current_app.config["AUTH_TOKEN_MAX_AGE_SECONDS"]
        )
    except (BadSignature, SignatureExpired):
        g.current_account = None
        return None

    account = AuthAccount.query.get(payload.get("account_id"))
    if not account or not account.is_active:
        g.current_account = None
        return None

    g.current_account = account
    return account


def auth_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        account = resolve_request_account()
        if not account:
            return jsonify({"success": False, "message": "Authentication required"}), 401
        return view_func(*args, **kwargs)

    return wrapper


def account_has_data_access(account):
    if not account:
        return False
    if account.role != "station":
        return True
    return account.approval_status == "approved"


def get_account_company_name(account):
    if not account:
        return ""
    if getattr(account, "company", None) and getattr(account.company, "name", None):
        return account.company.name
    return getattr(account, "company_name", "") or ""


def station_belongs_to_account_company(account, station):
    if not account or not station:
        return False

    account_company_id = getattr(account, "company_id", None)
    station_company_id = getattr(station, "company_id", None)

    if account_company_id and station_company_id:
        return account_company_id == station_company_id

    return get_account_company_name(account) == (
        (getattr(station, "company", None) and getattr(station.company, "name", None))
        or getattr(station, "company_name", "")
        or ""
    )


def approved_access_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        account = resolve_request_account()
        if not account:
            return jsonify({"success": False, "message": "Authentication required"}), 401

        if not account_has_data_access(account):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Your station access is still pending approval",
                        "code": "PENDING_APPROVAL",
                    }
                ),
                403,
            )

        return view_func(*args, **kwargs)

    return wrapper


def roles_required(*roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            account = resolve_request_account()
            if not account:
                return (
                    jsonify({"success": False, "message": "Authentication required"}),
                    401,
                )

            if account.role not in roles:
                return jsonify({"success": False, "message": "Access denied"}), 403

            if not account_has_data_access(account):
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Your station access is still pending approval",
                            "code": "PENDING_APPROVAL",
                        }
                    ),
                    403,
                )

            return view_func(*args, **kwargs)

        return wrapper

    return decorator


def can_access_station(account, station_id):
    return account.role == "company" or (
        account.role == "station" and account.station_id == station_id
    )


def can_access_rider(account, rider_id):
    return account.role == "company" or (
        account.role == "rider" and account.rider_id == rider_id
    )
