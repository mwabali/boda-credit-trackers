from flask import Blueprint, jsonify


health_bp = Blueprint("health", __name__)


@health_bp.get("/")
def healthcheck():
    return jsonify(
        {
            "message": "Boda Credit Tracker API",
            "status": "running",
            "backend": "flask",
        }
    )
