from app.database.db import get_db_connection

def seed_stations():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO stations (name, location, manager_name)
        VALUES
        ('Shell Eldoret','Eldoret Town','Peter Kiptoo'),
        ('Total Kisumu','Kisumu','James Kimani'),
        ('Rubis Langata','Langas','Mary Wanjiku');
    """)

    conn.commit()
    cursor.close()
    conn.close()

    print("Stations seeded successfully")