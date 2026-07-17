from flask import Blueprint, current_app, jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database.db import db


health_bp = Blueprint("health", __name__)


@health_bp.get("/")
def healthcheck():
    return jsonify(
        {
            "message": "Boda Credit Tracker API",
            "status": "running",
            "backend": "flask",
            "databaseConfigured": bool(current_app.config.get("DATABASE_URL")),
            "databaseBootstrapOnStartup": current_app.config.get("AUTO_BOOTSTRAP_DATABASE"),
        }
    )


@health_bp.get("/health/db")
def database_healthcheck():
    try:
        db.session.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        current_app.logger.exception("Database healthcheck failed")
        return (
            jsonify(
                {
                    "success": False,
                    "status": "unavailable",
                    "message": "Database is not reachable",
                    "error": error.__class__.__name__,
                }
            ),
            503,
        )

    return jsonify(
        {
            "success": True,
            "status": "running",
            "message": "Database connection is healthy",
        }
    )
