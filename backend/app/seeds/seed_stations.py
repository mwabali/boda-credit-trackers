from app.database.db import get_db_connection

def seed_stations():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO stations (name, company_name, location, manager_name, manager_phone)
        VALUES
        ('Eldoret','Total','Eldoret Town','Peter Kiptoo','+254711000101'),
        ('Kisumu','Total','Kisumu','James Kimani','+254711000102'),
        ('Langata','Total','Langas','Mary Wanjiku','+254711000103');
    """)

    conn.commit()
    cursor.close()
    conn.close()

    print("Stations seeded successfully")
