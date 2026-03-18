from models import AuthAccount


def build_account(
    email,
    password,
    role,
    full_name,
    company_name="Total",
    station_id=None,
    rider_id=None,
):
    account = AuthAccount(
        email=email,
        role=role,
        full_name=full_name,
        company_name=company_name,
        station_id=station_id,
        rider_id=rider_id,
    )
    account.set_password(password)
    return account


def seed_accounts():
    return [
        build_account(
            email="growth.manager@total.co.ke",
            password="TotalGrowth2026!",
            role="company",
            full_name="Total Company Growth Manager",
        ),
        build_account(
            email="eldoret.rep@total.co.ke",
            password="StationRep2026!",
            role="station",
            full_name="Total Eldoret Management Rep",
            station_id=1,
        ),
        build_account(
            email="john.kamau@rider.bodacredit.app",
            password="RiderAccess2026!",
            role="rider",
            full_name="John Kamau",
            rider_id=1,
        ),
    ]
