import os
from app.database.db import get_db_connection

MIGRATIONS_PATH = "app/migrations"

def run_migrations():
    conn = get_db_connection()
    cursor = conn.cursor()

    files = sorted(os.listdir(MIGRATIONS_PATH))

    for file in files:
        with open(os.path.join(MIGRATIONS_PATH, file), "r") as f:
            sql = f.read()
            cursor.execute(sql)
            print(f"Executed migration: {file}")

    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    run_migrations()