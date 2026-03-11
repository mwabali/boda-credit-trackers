from app.database.db import get_db_connection

def seed_transactions():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO transactions (rider_id, station_id, amount, status)
        VALUES
        (1,1,1500,'pending'),
        (2,2,2000,'approved'),
        (3,3,1000,'pending');
    """)

    conn.commit()
    cursor.close()
    conn.close()

    print("Transactions seeded successfully")