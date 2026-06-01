from app.data.kenya_stations import TOTALENERGIES_KENYA_STATIONS
from app.database.db import db
from models import Company, Station


def ensure_default_station_directory():
    company = Company.query.filter_by(name="TotalEnergies").first()
    if not company:
        company = Company(name="TotalEnergies")
        db.session.add(company)
        db.session.flush()

    existing_names = {
        name
        for name, in db.session.query(Station.name)
        .filter(Station.company_id == company.id)
        .all()
    }
    stations = [
        Station(
            name=name,
            company_id=company.id,
            company_name=company.name,
            location=region,
            status="active",
        )
        for name, region in TOTALENERGIES_KENYA_STATIONS
        if name not in existing_names
    ]
    if stations:
        db.session.add_all(stations)
    db.session.commit()
    return len(stations)
