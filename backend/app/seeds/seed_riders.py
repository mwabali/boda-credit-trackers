from app.database.db import get_db_connection

def seed_riders():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO riders (name, phone, license_plate)
        VALUES
        ('John Kamau','0712345678','KMC 234A'),
        ('Peter Otieno','0723456789','KDA 112B'),
        ('Samuel Kiptoo','0701234567','KBB 887X');
    """)

    conn.commit()
    cursor.close()
    conn.close()

    print("Riders seeded successfully")