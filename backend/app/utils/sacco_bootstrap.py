from app.data.kenya_saccos import KENYA_RIDER_SACCOS
from app.database.db import db
from models import Sacco


def ensure_default_sacco_directory():
    existing_names = {
        name.lower()
        for name, in db.session.query(Sacco.name).all()
        if name
    }
    saccos = [
        Sacco(name=name, location=location)
        for name, location in KENYA_RIDER_SACCOS
        if name.lower() not in existing_names
    ]
    if saccos:
        db.session.add_all(saccos)
    db.session.commit()
    return len(saccos)
