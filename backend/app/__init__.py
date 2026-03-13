from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from app.config import Config
from app.database.db import init_db

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    init_db(app)
    import models  # noqa: F401

    from app.routes.health import health_bp
    from app.routes.riders import riders_bp
    from app.routes.stations import stations_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(riders_bp)
    app.register_blueprint(stations_bp)

    return app
