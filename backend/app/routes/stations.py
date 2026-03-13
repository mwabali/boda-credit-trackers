from flask import Blueprint, jsonify, request

from app.database.db import db
from app.utils.station_company import hydrate_station, prepare_station_payload
from models import Station


stations_bp = Blueprint("stations", __name__, url_prefix="/stations")

VALID_STATION_STATUSES = {"active", "closed", "maintenance"}


@stations_bp.get("")
def list_stations():
    try:
        status = request.args.get("status", "").strip()

        query = Station.query
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
def get_station(station_id):
    try:
        station = Station.query.get(station_id)

        if not station:
            return jsonify({"success": False, "message": "Station not found"}), 404

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
def create_station():
    try:
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
                "location": location,
                "manager_name": (payload.get("managerName") or "").strip() or None,
                "manager_phone": (payload.get("managerPhone") or "").strip() or None,
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
def patch_station_status(station_id):
    try:
        station = Station.query.get(station_id)

        if not station:
            return jsonify({"success": False, "message": "Station not found"}), 404

        status = (request.get_json() or {}).get("status")
        if status not in VALID_STATION_STATUSES:
            return jsonify({"success": False, "message": "Invalid station status"}), 400

        station.status = status
        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": "Station status updated successfully",
                "data": hydrate_station(station),
            }
        )
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
def update_station(station_id):
    try:
        station = Station.query.get(station_id)

        if not station:
            return jsonify({"success": False, "message": "Station not found"}), 404

        payload = request.get_json() or {}
        status = payload.get("status", station.status)

        if status and status not in VALID_STATION_STATUSES:
            return jsonify({"success": False, "message": "Invalid station status"}), 400

        station_payload = prepare_station_payload(
            {
                "name": (payload.get("name") or station.name).strip(),
                "company_name": payload.get("companyName") or station.company_name,
                "location": (payload.get("location") or station.location).strip(),
                "manager_name": (
                    payload.get("managerName")
                    if "managerName" in payload
                    else station.manager_name
                ),
                "manager_phone": (
                    payload.get("managerPhone")
                    if "managerPhone" in payload
                    else station.manager_phone
                ),
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
