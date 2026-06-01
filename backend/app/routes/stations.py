from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.database.db import db
from app.utils.auth import (
    approved_access_required,
    get_account_company_name,
    resolve_request_account,
    roles_required,
    station_belongs_to_account_company,
)
from app.utils.db_errors import format_integrity_error
from app.utils.station_company import hydrate_station, prepare_station_payload
from models import Station


stations_bp = Blueprint("stations", __name__, url_prefix="/stations")

VALID_STATION_STATUSES = {"active", "closed", "maintenance"}


@stations_bp.get("")
@approved_access_required
def list_stations():
    try:
        account = resolve_request_account()
        status = request.args.get("status", "").strip()

        query = Station.query
        if account.role == "company":
            if account.company_id:
                query = query.filter(Station.company_id == account.company_id)
            else:
                query = query.filter(Station.company_name == get_account_company_name(account))
        elif account.role == "station":
            query = query.filter(Station.id == account.station_id)
        elif account.role == "sacco":
            query = query.filter(Station.status == "active")
        elif account.role == "rider" and not status:
            query = query.filter(Station.status == "active")

        if status:
            query = query.filter(Station.status == status)

        stations = query.order_by(Station.created_at.desc()).all()
        data = [hydrate_station(station) for station in stations]

        return jsonify({"success": True, "count": len(data), "data": data})
    except Exception as error:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Error fetching stations",
                    "error": str(error),
                }
            ),
            500,
        )


@stations_bp.get("/<int:station_id>")
@approved_access_required
def get_station(station_id):
    try:
        account = resolve_request_account()
        station = Station.query.get(station_id)

        if not station:
            return jsonify({"success": False, "message": "Station not found"}), 404

        if account.role == "company" and not station_belongs_to_account_company(account, station):
            return jsonify({"success": False, "message": "Access denied"}), 403

        if account.role == "station" and account.station_id != station_id:
            return jsonify({"success": False, "message": "Access denied"}), 403

        if account.role == "rider" and station.status != "active":
            return jsonify({"success": False, "message": "Access denied"}), 403

        return jsonify({"success": True, "data": hydrate_station(station)})
    except Exception as error:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Error fetching station",
                    "error": str(error),
                }
            ),
            500,
        )


@stations_bp.post("")
@roles_required("company")
def create_station():
    try:
        account = resolve_request_account()
        payload = request.get_json() or {}
        name = (payload.get("name") or "").strip()
        location = (payload.get("location") or "").strip()

        if not name or not location:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Name and location are required",
                    }
                ),
                400,
            )

        station_payload = prepare_station_payload(
            {
                "name": name,
                "company_id": account.company_id,
                "company_name": account.company_name,
                "location": location,
                "manager_name": None,
                "manager_phone": None,
            }
        )

        station = Station(**station_payload)
        db.session.add(station)
        db.session.commit()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Station created successfully",
                    "data": hydrate_station(station),
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
    except ValueError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 400
    except IntegrityError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": format_integrity_error(error)}), 409
    except Exception as error:
        db.session.rollback()
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Error creating station",
                    "error": str(error),
                }
            ),
            500,
        )


@stations_bp.patch("/<int:station_id>")
@roles_required("company")
def patch_station_status(station_id):
    try:
        station = Station.query.get(station_id)

        if not station:
            return jsonify({"success": False, "message": "Station not found"}), 404

        account = resolve_request_account()
        status = (request.get_json() or {}).get("status")
        if status not in VALID_STATION_STATUSES:
            return jsonify({"success": False, "message": "Invalid station status"}), 400

        if not station_belongs_to_account_company(account, station):
            return jsonify({"success": False, "message": "Access denied"}), 403

        station.status = status
        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Station status updated successfully",
                "data": hydrate_station(station),
            }
        )
    except ValueError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": str(error)}), 400
    except IntegrityError as error:
        db.session.rollback()
        return jsonify({"success": False, "message": format_integrity_error(error)}), 409
    except Exception as error:
        db.session.rollback()
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Error updating station status",
                    "error": str(error),
                }
            ),
            500,
        )


@stations_bp.put("/<int:station_id>")
@roles_required("company")
def update_station(station_id):
    try:
        station = Station.query.get(station_id)

        if not station:
            return jsonify({"success": False, "message": "Station not found"}), 404

        account = resolve_request_account()
        payload = request.get_json() or {}
        status = payload.get("status", station.status)

        if status and status not in VALID_STATION_STATUSES:
            return jsonify({"success": False, "message": "Invalid station status"}), 400

        if not station_belongs_to_account_company(account, station):
            return jsonify({"success": False, "message": "Access denied"}), 403

        station_payload = prepare_station_payload(
            {
                "name": (payload.get("name") or station.name).strip(),
                "company_name": station.company_name,
                "company_id": station.company_id,
                "location": (payload.get("location") or station.location).strip(),
                "manager_name": station.manager_name,
                "manager_phone": station.manager_phone,
                "status": status,
            }
        )

        station.name = station_payload["name"]
        station.company_name = station_payload["company_name"]
        station.location = station_payload["location"]
        station.manager_name = station_payload.get("manager_name")
        station.manager_phone = station_payload.get("manager_phone")
        station.status = station_payload.get("status", station.status)
        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Station updated successfully",
                "data": hydrate_station(station),
            }
        )
    except Exception as error:
        db.session.rollback()
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Error updating station",
                    "error": str(error),
                }
            ),
            500,
        )
