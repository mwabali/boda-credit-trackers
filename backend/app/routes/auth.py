from flask import Blueprint, jsonify, request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.database.db import db
from app.utils.db_errors import format_integrity_error
from app.utils.auth import auth_required, generate_auth_token, resolve_request_account
from app.utils.notifications import create_notification, notify_company_accounts
from models import AuthAccount, Rider, Station


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def normalize_phone(value):
    return (value or "").strip().replace(" ", "")


@auth_bp.get("/portal-options")
def portal_options():
    try:
        company_names = [
            row[0]
            for row in db.session.query(Station.company_name)
            .distinct()
            .order_by(func.lower(Station.company_name))
            .all()
            if row[0]
        ]

        if "Total" not in company_names:
            company_names.insert(0, "Total")

        stations = (
            Station.query.filter(Station.status == "active")
            .order_by(func.lower(Station.company_name), func.lower(Station.name))
            .all()
        )

        return jsonify(
            {
                "success": True,
                "data": {
                    "companies": company_names,
                    "stations": [station.to_dict() for station in stations],
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
        station_name = (
            payload.get("stationName") or payload.get("station_name") or ""
        ).strip()
        station_location = (
            payload.get("stationLocation") or payload.get("station_location") or ""
        ).strip()
        authority_confirmed = bool(
            payload.get("authorityConfirmed") or payload.get("authority_confirmed")
        )

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
            if not company_name or not station_id:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Company and station are required",
                        }
                    ),
                    400,
                )

            station = Station.query.get(station_id)
            if not station:
                return jsonify({"success": False, "message": "Selected station was not found"}), 404
            if station.company_name != company_name:
                return jsonify({"success": False, "message": "Selected station does not belong to that company"}), 400
            if station.account:
                return jsonify({"success": False, "message": "That station already has a station manager account"}), 409

            account.station_id = station.id
            account.company_name = station.company_name
            account.approval_status = "pending"

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
            account.approval_status = "approved"
        else:
            if not company_name or not station_name or not station_location:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Company name, station name, and station location are required",
                        }
                    ),
                    400,
                )

            if not authority_confirmed:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "You must confirm that you are authorized to create this company account",
                        }
                    ),
                    400,
                )

            station = Station(
                name=station_name,
                company_name=company_name,
                location=station_location,
                status="active",
            )
            db.session.add(station)
            account.approval_status = "approved"

        account.set_password(password)
        db.session.add(account)
        db.session.flush()

        if role == "station":
            create_notification(
                account.id,
                "Approval pending",
                "Your station manager account is waiting for company approval. You can check this page for updates.",
                notification_type="warning",
                action_path="/notifications",
            )
            notify_company_accounts(
                account.company_name,
                "New station manager application",
                f"{account.full_name} has requested access for {station.company_name} {station.name}.",
                notification_type="approval",
                action_path="/notifications",
            )
        else:
            create_notification(
                account.id,
                "Account ready",
                "Your account is ready to use.",
                notification_type="success",
                action_path="/home",
            )

        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": (
                        "Account created. Approval is pending."
                        if role == "station"
                        else "Account created successfully"
                    ),
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
