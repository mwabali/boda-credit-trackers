from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.database.db import db
from app.utils.db_errors import friendly_db_error
from app.utils.auth import auth_required, generate_auth_token, resolve_request_account
from models import AuthAccount, Rider, Station


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def normalize_phone(value):
    return (value or "").strip().replace(" ", "")


@auth_bp.get("/signup-options")
def signup_options():
    try:
        stations = (
            Station.query.filter(Station.status == "active")
            .order_by(Station.created_at.desc())
            .all()
        )
        riders = (
            Rider.query.filter(Rider.status != "suspended")
            .order_by(Rider.created_at.desc())
            .all()
        )

        return jsonify(
            {
                "success": True,
                "data": {
                    "stations": [
                        {
                            "id": station.id,
                            "name": station.name,
                            "displayName": f"{station.company_name} {station.name}".strip(),
                            "location": station.location,
                            "hasAccount": bool(station.account),
                        }
                        for station in stations
                    ],
                    "riders": [
                        {
                            "id": rider.id,
                            "name": rider.name,
                            "licensePlate": rider.license_plate,
                            "hasAccount": bool(rider.account),
                        }
                        for rider in riders
                    ],
                },
            }
        )
    except Exception as error:
        return jsonify({"success": False, "message": str(error)}), 500


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


@auth_bp.post("/register")
def register():
    try:
        payload = request.get_json() or {}
        role = (payload.get("role") or "").strip().lower()
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password") or ""
        full_name = (payload.get("fullName") or payload.get("full_name") or "").strip()
        company_name = (
            payload.get("companyName") or payload.get("company_name") or "Total"
        ).strip()

        if role not in {"company", "station", "rider"}:
            return jsonify({"success": False, "message": "Please choose a valid portal"}), 400

        if not email or not password or not full_name:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Full name, email, and password are required",
                    }
                ),
                400,
            )

        if AuthAccount.query.filter_by(email=email).first():
            return jsonify({"success": False, "message": "An account with that email already exists"}), 409

        account = AuthAccount(
            email=email,
            role=role,
            full_name=full_name,
            company_name=company_name or "Total",
        )

        if role == "station":
            station_id = payload.get("stationId") or payload.get("station_id")
            management_phoneline = normalize_phone(
                payload.get("managementPhoneline")
                or payload.get("management_phoneline")
                or payload.get("managerPhone")
                or payload.get("manager_phone")
            )

            if not station_id or not management_phoneline:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Station and management phoneline are required",
                        }
                    ),
                    400,
                )

            station = Station.query.get(station_id)
            if not station:
                return jsonify({"success": False, "message": "Selected station was not found"}), 404
            if station.account:
                return jsonify({"success": False, "message": "That station already has an account"}), 409
            if normalize_phone(station.manager_phone) != management_phoneline:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Management phoneline does not match our station records",
                        }
                    ),
                    400,
                )

            account.station_id = station.id
            account.company_name = station.company_name

        elif role == "rider":
            rider_id = payload.get("riderId") or payload.get("rider_id")
            phone = normalize_phone(payload.get("phone"))

            if not rider_id or not phone:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Rider and phone number are required",
                        }
                    ),
                    400,
                )

            rider = Rider.query.get(rider_id)
            if not rider:
                return jsonify({"success": False, "message": "Selected rider was not found"}), 404
            if rider.account:
                return jsonify({"success": False, "message": "That rider already has an account"}), 409
            if normalize_phone(rider.phone) != phone:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Phone number does not match our rider records",
                        }
                    ),
                    400,
                )

            account.rider_id = rider.id
            account.company_name = "Total"

        account.set_password(password)
        db.session.add(account)
        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Account created successfully",
                    "token": generate_auth_token(account),
                    "data": account.to_session_dict(),
                }
            ),
            201,
        )
    except ValueError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 400
    except IntegrityError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": friendly_db_error(error)}), 409
    except Exception as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 500


@auth_bp.get("/me")
@auth_required
def current_account():
    account = resolve_request_account()
    return jsonify({"success": True, "data": account.to_session_dict()})


@auth_bp.post("/logout")
def logout():
    return jsonify({"success": True, "message": "Signed out"})
