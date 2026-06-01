from app.data.kenya_stations import TOTALENERGIES_KENYA_STATIONS
from models import Station


def seed_stations():
    stations = [
        Station(
            name=name,
            company_name="TotalEnergies",
            location=region,
            status="active",
        )
        for name, region in TOTALENERGIES_KENYA_STATIONS
    ]

    return stations
