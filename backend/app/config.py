import os
from pathlib import Path


def _normalize_database_url(database_url: str | None) -> str | None:
    if not database_url:
        return None

    # Flask/SQLAlchemy expects the postgres dialect name rather than postgres.
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql://", 1)

    return database_url


class Config:
    BASE_DIR = Path(__file__).resolve().parents[1]
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"
    PORT = int(os.getenv("PORT", "5050"))
    SECRET_KEY = os.getenv("SECRET_KEY", "boda-credit-dev-secret")
    AUTH_TOKEN_MAX_AGE_SECONDS = int(os.getenv("AUTH_TOKEN_MAX_AGE_SECONDS", "604800"))
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]

    DATABASE_URL = _normalize_database_url(os.getenv("DATABASE_URL"))
    DATABASE_CONNECT_TIMEOUT_SECONDS = int(os.getenv("DATABASE_CONNECT_TIMEOUT_SECONDS", "5"))
    SQLITE_STORAGE_PATH = os.getenv("SQLITE_STORAGE_PATH", "./database.sqlite")
    SQLITE_STORAGE_ABSOLUTE_PATH = str(
        (
            Path(SQLITE_STORAGE_PATH)
            if Path(SQLITE_STORAGE_PATH).is_absolute()
            else (BASE_DIR / SQLITE_STORAGE_PATH).resolve()
        )
    )
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or f"sqlite:///{SQLITE_STORAGE_PATH}"
    if not DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{SQLITE_STORAGE_ABSOLUTE_PATH}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = (
        {
            "pool_pre_ping": True,
            "pool_timeout": DATABASE_CONNECT_TIMEOUT_SECONDS,
            "connect_args": {
                "sslmode": "require",
                "connect_timeout": DATABASE_CONNECT_TIMEOUT_SECONDS,
            },
        }
        if DATABASE_URL and DATABASE_URL.startswith("postgresql")
        else {}
    )
    AUTO_BOOTSTRAP_DATABASE = os.getenv(
        "AUTO_BOOTSTRAP_DATABASE",
        "1",
    ) == "1"
    REQUIRE_DATABASE_ON_STARTUP = os.getenv("REQUIRE_DATABASE_ON_STARTUP", "0") == "1"
