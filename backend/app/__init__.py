from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from app.config import Config
from app.database.db import init_db

load_dotenv()


def _table_exists(db, table_name):
    dialect = db.engine.dialect.name
    if dialect == "sqlite":
        result = db.session.execute(
            text(
                """
                SELECT name
                FROM sqlite_master
                WHERE type = 'table' AND name = :table_name
                """
            ),
            {"table_name": table_name},
        ).scalar()
        return bool(result)

    result = db.session.execute(
        text(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = :table_name
            """
        ),
        {"table_name": table_name},
    ).scalar()
    return bool(result)


def _column_exists(db, table_name, column_name):
    dialect = db.engine.dialect.name
    if dialect == "sqlite":
        rows = db.session.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
        return any(row[1] == column_name for row in rows)

    result = db.session.execute(
        text(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table_name
              AND column_name = :column_name
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    ).scalar()
    return bool(result)


def _ensure_column(db, table_name, column_name, ddl):
    if not _column_exists(db, table_name, column_name):
        db.session.execute(text(ddl))
        return True
    return False


def bootstrap_database(app):
    from app.database.db import db

    try:
        db.create_all()
    except OperationalError as error:
        if "already exists" not in str(error).lower():
            raise

    schema_changed = False

    if _table_exists(db, "stations"):
        schema_changed = _ensure_column(
            db,
            "stations",
            "company_id",
            "ALTER TABLE stations ADD COLUMN company_id INTEGER",
        ) or schema_changed

    if _table_exists(db, "riders"):
        schema_changed = _ensure_column(
            db,
            "riders",
            "sacco_id",
            "ALTER TABLE riders ADD COLUMN sacco_id INTEGER",
        ) or schema_changed

    if _table_exists(db, "auth_accounts"):
        schema_changed = _ensure_column(
            db,
            "auth_accounts",
            "company_id",
            "ALTER TABLE auth_accounts ADD COLUMN company_id INTEGER",
        ) or schema_changed

        schema_changed = _ensure_column(
            db,
            "auth_accounts",
            "sacco_id",
            "ALTER TABLE auth_accounts ADD COLUMN sacco_id INTEGER",
        ) or schema_changed

        schema_changed = _ensure_column(
            db,
            "auth_accounts",
            "approval_status",
            """
            ALTER TABLE auth_accounts
            ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'approved'
            """,
        ) or schema_changed

        schema_changed = _ensure_column(
            db,
            "auth_accounts",
            "approved_at",
            """
            ALTER TABLE auth_accounts
            ADD COLUMN approved_at VARCHAR(64)
            """,
        ) or schema_changed

        schema_changed = _ensure_column(
            db,
            "auth_accounts",
            "approved_by_account_id",
            """
            ALTER TABLE auth_accounts
            ADD COLUMN approved_by_account_id INTEGER
            """,
        ) or schema_changed

    db.session.execute(
        text(
            """
            INSERT INTO companies (name, created_at, updated_at)
            SELECT DISTINCT company_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM stations
            WHERE company_name IS NOT NULL AND trim(company_name) <> ''
            ON CONFLICT (name) DO NOTHING
            """
        )
    )
    db.session.execute(
        text(
            """
            INSERT INTO companies (name, created_at, updated_at)
            SELECT DISTINCT company_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM auth_accounts
            WHERE company_name IS NOT NULL
              AND trim(company_name) <> ''
              AND role IN ('company', 'station')
            ON CONFLICT (name) DO NOTHING
            """
        )
    )
    db.session.execute(
        text(
            """
            UPDATE stations
            SET company_id = companies.id
            FROM companies
            WHERE stations.company_id IS NULL
              AND companies.name = stations.company_name
            """
        )
    )
    db.session.execute(
        text(
            """
            UPDATE auth_accounts
            SET company_id = companies.id
            FROM companies
            WHERE auth_accounts.company_id IS NULL
              AND auth_accounts.role IN ('company', 'station')
              AND companies.name = auth_accounts.company_name
            """
        )
    )
    db.session.commit()

    from app.utils.station_bootstrap import ensure_default_station_directory
    from app.utils.sacco_bootstrap import ensure_default_sacco_directory

    ensure_default_station_directory()
    ensure_default_sacco_directory()

    app.logger.info("Database bootstrap completed; schema_changed=%s", schema_changed)


def maybe_bootstrap_database(app):
    if not app.config["AUTO_BOOTSTRAP_DATABASE"]:
        app.logger.info("Database bootstrap skipped on startup")
        return

    try:
        with app.app_context():
            bootstrap_database(app)
    except SQLAlchemyError:
        if app.config["REQUIRE_DATABASE_ON_STARTUP"]:
            raise
        app.logger.exception("Database bootstrap failed; continuing startup")


def register_error_handlers(app):
    @app.errorhandler(SQLAlchemyError)
    def handle_database_error(error):
        app.logger.exception("Database request failed")
        return (
            {
                "success": False,
                "message": "Database is currently unavailable",
                "error": error.__class__.__name__,
            },
            503,
        )


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, origins=app.config["CORS_ORIGINS"], max_age=86400)
    init_db(app)
    import models  # noqa: F401

    from app.routes.auth import auth_bp
    from app.routes.health import health_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.notifications import notifications_bp
    from app.routes.riders import riders_bp
    from app.routes.saccos import saccos_bp
    from app.routes.stations import stations_bp
    from app.routes.transactions import transactions_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(riders_bp)
    app.register_blueprint(saccos_bp)
    app.register_blueprint(stations_bp)
    app.register_blueprint(transactions_bp)
    register_error_handlers(app)
    maybe_bootstrap_database(app)

    return app
