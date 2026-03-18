from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError
from app.config import Config
from app.database.db import init_db

load_dotenv()


def _ensure_column(db, inspector, table_name, column_name, ddl):
    existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
    if column_name not in existing_columns:
        db.session.execute(text(ddl))
        return True
    return False


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, max_age=86400)
    init_db(app)
    import models  # noqa: F401

    with app.app_context():
        from app.database.db import db

        try:
            db.create_all()
        except OperationalError as error:
            if "already exists" not in str(error).lower():
                raise
        inspector = inspect(db.engine)

        schema_changed = False

        if inspector.has_table("stations"):
            schema_changed = _ensure_column(
                db,
                inspector,
                "stations",
                "company_id",
                "ALTER TABLE stations ADD COLUMN company_id INTEGER",
            ) or schema_changed
            inspector = inspect(db.engine)

        if inspector.has_table("auth_accounts"):
            schema_changed = _ensure_column(
                db,
                inspector,
                "auth_accounts",
                "company_id",
                "ALTER TABLE auth_accounts ADD COLUMN company_id INTEGER",
            ) or schema_changed
            inspector = inspect(db.engine)

        if inspector.has_table("auth_accounts"):
            schema_changed = _ensure_column(
                db,
                inspector,
                "auth_accounts",
                "approval_status",
                """
                ALTER TABLE auth_accounts
                ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'approved'
                """,
            ) or schema_changed
            inspector = inspect(db.engine)

            schema_changed = _ensure_column(
                db,
                inspector,
                "auth_accounts",
                "approved_at",
                """
                ALTER TABLE auth_accounts
                ADD COLUMN approved_at VARCHAR(64)
                """,
            ) or schema_changed
            inspector = inspect(db.engine)

            schema_changed = _ensure_column(
                db,
                inspector,
                "auth_accounts",
                "approved_by_account_id",
                """
                ALTER TABLE auth_accounts
                ADD COLUMN approved_by_account_id INTEGER
                """,
            ) or schema_changed
            inspector = inspect(db.engine)

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

        if schema_changed:
            db.session.commit()
        else:
            db.session.commit()

    from app.routes.auth import auth_bp
    from app.routes.health import health_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.notifications import notifications_bp
    from app.routes.riders import riders_bp
    from app.routes.stations import stations_bp
    from app.routes.transactions import transactions_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(riders_bp)
    app.register_blueprint(stations_bp)
    app.register_blueprint(transactions_bp)

    return app
