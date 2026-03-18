from app import create_app
from app.database.db import db
from models import AuthAccount, Rider, Station


def upsert_account(email, password, role, full_name, company_name="Total", station=None, rider=None):
    account = AuthAccount.query.filter_by(email=email).first()
    if not account:
        account = AuthAccount(
            email=email,
            role=role,
            full_name=full_name,
            company_name=company_name,
        )
        db.session.add(account)

    account.role = role
    account.full_name = full_name
    account.company_name = company_name
    account.station_id = getattr(station, "id", None)
    account.rider_id = getattr(rider, "id", None)
    account.is_active = True
    account.set_password(password)

    return account


def bootstrap_auth_accounts():
    app = create_app()

    with app.app_context():
        first_station = Station.query.order_by(Station.id.asc()).first()
        first_rider = Rider.query.order_by(Rider.id.asc()).first()

        upsert_account(
            email="growth.manager@total.co.ke",
            password="TotalGrowth2026!",
            role="company",
            full_name="Total Company Growth Manager",
        )

        if first_station:
            upsert_account(
                email="station.rep@total.co.ke",
                password="StationRep2026!",
                role="station",
                full_name=f"{first_station.company_name} {first_station.name} Management Rep",
                station=first_station,
            )

        if first_rider:
            upsert_account(
                email="rider.account@bodacredit.app",
                password="RiderAccess2026!",
                role="rider",
                full_name=first_rider.name,
                rider=first_rider,
            )

        db.session.commit()
        print("Auth accounts bootstrapped successfully")


if __name__ == "__main__":
    bootstrap_auth_accounts()
