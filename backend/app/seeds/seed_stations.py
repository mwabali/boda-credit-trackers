from models import Station


def seed_stations():
    stations = [
        Station(
            name="Eldoret",
            company_name="Total",
            location="Eldoret Town",
            manager_name="Peter Kiptoo",
            manager_phone="+254711000101",
        ),
        Station(
            name="Kisumu",
            company_name="Total",
            location="Kisumu",
            manager_name="James Kimani",
            manager_phone="+254711000102",
        ),
        Station(
            name="Langata",
            company_name="Total",
            location="Langas",
            manager_name="Mary Wanjiku",
            manager_phone="+254711000103",
        ),
    ]

    return stations
