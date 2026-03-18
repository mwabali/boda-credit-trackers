from app import create_app
from app.database.db import db
from app.seeds.seed_accounts import seed_accounts
from app.seeds.seed_riders import seed_riders
from app.seeds.seed_stations import seed_stations
from app.seeds.seed_transactions import seed_transactions
from models import AuthAccount, Rider, Station, Transaction


def run_all_seeds():
    app = create_app()

    with app.app_context():
        AuthAccount.query.delete()
        Transaction.query.delete()
        Station.query.delete()
        Rider.query.delete()
        db.session.commit()

        db.session.add_all(seed_riders())
        db.session.commit()
        print("Riders seeded successfully")

        db.session.add_all(seed_stations())
        db.session.commit()
        print("Stations seeded successfully")

        db.session.add_all(seed_transactions())
        db.session.commit()
        print("Transactions seeded successfully")

        db.session.add_all(seed_accounts())
        db.session.commit()
        print("Auth accounts seeded successfully")


if __name__ == "__main__":
    run_all_seeds()
