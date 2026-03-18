from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
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

    from app.routes.auth import auth_bp
    from app.routes.health import health_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.riders import riders_bp
    from app.routes.stations import stations_bp
    from app.routes.transactions import transactions_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(riders_bp)
    app.register_blueprint(stations_bp)
    app.register_blueprint(transactions_bp)

    return app
