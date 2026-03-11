from app.seeds.seed_riders import seed_riders
from app.seeds.seed_stations import seed_stations
from app.seeds.seed_transactions import seed_transactions

def run_all_seeds():
    seed_riders()
    seed_stations()
    seed_transactions()

if __name__ == "__main__":
    run_all_seeds()