from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.database.db import db
from app.utils.db_errors import format_integrity_error
from app.utils.auth import auth_required, generate_auth_token, resolve_request_account
from models import AuthAccount, Rider, Station


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def normalize_phone(value):
    return (value or "").strip().replace(" ", "")


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
        rider = None
        station = None

        if role == "station":
            branch_name = (payload.get("branchName") or payload.get("branch_name") or "").strip()
            location = (payload.get("location") or "").strip()
            manager_name = (payload.get("managerName") or payload.get("manager_name") or "").strip()
            management_phoneline = normalize_phone(
                payload.get("managementPhoneline")
                or payload.get("management_phoneline")
                or payload.get("managerPhone")
                or payload.get("manager_phone")
            )

            if not branch_name or not location or not manager_name or not management_phoneline:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Branch name, location, manager name, and management phoneline are required",
                        }
                    ),
                    400,
                )

            station = Station(
                name=branch_name,
                company_name=company_name or "Total",
                location=location,
                manager_name=manager_name,
                manager_phone=management_phoneline,
                status="active",
            )
            db.session.add(station)
            db.session.flush()

            account.station_id = station.id
            account.company_name = station.company_name

        elif role == "rider":
            phone = normalize_phone(payload.get("phone"))
            license_plate = (
                payload.get("licensePlate")
                or payload.get("license_plate")
                or payload.get("number_plate")
                or ""
            ).strip()

            if not phone or not license_plate:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Phone number and number plate are required",
                        }
                    ),
                    400,
                )

            rider = Rider(
                name=full_name,
                phone=phone,
                license_plate=license_plate,
                status="active",
            )
            db.session.add(rider)
            db.session.flush()

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
        return jsonify({"success": False, "message": format_integrity_error(error)}), 409
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
