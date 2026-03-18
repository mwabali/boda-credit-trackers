from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import inspect, text
from app.config import Config
from app.database.db import init_db

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, max_age=86400)
    init_db(app)
    import models  # noqa: F401

    with app.app_context():
        from app.database.db import db

        db.create_all()
        inspector = inspect(db.engine)
        if inspector.has_table("auth_accounts"):
            existing_columns = {
                column["name"] for column in inspector.get_columns("auth_accounts")
            }

            if "approval_status" not in existing_columns:
                db.session.execute(
                    text(
                        """
                        ALTER TABLE auth_accounts
                        ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'approved'
                        """
                    )
                )

            if "approved_at" not in existing_columns:
                db.session.execute(
                    text(
                        """
                        ALTER TABLE auth_accounts
                        ADD COLUMN approved_at VARCHAR(64)
                        """
                    )
                )

            if "approved_by_account_id" not in existing_columns:
                db.session.execute(
                    text(
                        """
                        ALTER TABLE auth_accounts
                        ADD COLUMN approved_by_account_id INTEGER
                        """
                    )
                )

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
