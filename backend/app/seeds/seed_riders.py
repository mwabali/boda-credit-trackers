from models import Rider


def seed_riders():
    riders = [
        Rider(name="John Kamau", phone="0712345678", license_plate="KMC 234A"),
        Rider(name="Peter Otieno", phone="0723456789", license_plate="KDA 112B"),
        Rider(name="Samuel Kiptoo", phone="0701234567", license_plate="KBB 887X"),
    ]

    return riders
