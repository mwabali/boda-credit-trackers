from models import Transaction


def seed_transactions():
    transactions = [
        Transaction(rider_id=1, station_id=1, amount=1500, liters=6.0, status="pending"),
        Transaction(rider_id=2, station_id=2, amount=2000, liters=8.0, status="approved"),
        Transaction(rider_id=3, station_id=3, amount=1000, liters=4.5, status="pending"),
    ]

    return transactions
