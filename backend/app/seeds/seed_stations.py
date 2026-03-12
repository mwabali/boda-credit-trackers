from app.database.db import get_db_connection

def seed_stations():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO stations (name, company_name, location, manager_name)
        VALUES
        ('Eldoret','Total','Eldoret Town','Peter Kiptoo'),
        ('Kisumu','Total','Kisumu','James Kimani'),
        ('Langata','Total','Langas','Mary Wanjiku');
    """)

    conn.commit()
    cursor.close()
    conn.close()

    print("Stations seeded successfully")
