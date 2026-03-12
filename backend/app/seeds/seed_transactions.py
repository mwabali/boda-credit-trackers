from app.database.db import get_db_connection

def seed_transactions():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO transactions (rider_id, station_id, amount, liters, status)
        VALUES
        (1,1,1500,6.0,'pending'),
        (2,2,2000,8.0,'approved'),
        (3,3,1000,4.5,'pending');
    """)

    conn.commit()
    cursor.close()
    conn.close()

    print("Transactions seeded successfully")
