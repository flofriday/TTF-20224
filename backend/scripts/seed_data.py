import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from app.models import Base, SkiLift


def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    example_lifts = [
        {
            "name": "Alpenpanorama Express",
            "capacity": 2400,
            "current_load": 1200,
            "description": "6er Sessellift mit Wetterschutzhaube",
            "image_url": "https://example.com/alpenpanorama.jpg",
            "webcam_url": "https://example.com/webcam/alpenpanorama",
        },
        {
            "name": "Gipfelblick Bahn",
            "capacity": 1800,
            "current_load": 900,
            "description": "4er Sessellift mit Förderband",
            "image_url": "https://example.com/gipfelblick.jpg",
            "webcam_url": "https://example.com/webcam/gipfelblick",
        },
        {
            "name": "Talabfahrt Gondel",
            "capacity": 3000,
            "current_load": 1500,
            "description": "10er Gondelbahn mit WLAN",
            "image_url": "https://example.com/talabfahrt.jpg",
            "webcam_url": "https://example.com/webcam/talabfahrt",
        },
    ]

    for lift_data in example_lifts:
        lift = SkiLift(**lift_data)
        db.add(lift)

    db.commit()
    db.close()


if __name__ == "__main__":
    seed_data()
    print("Beispieldaten wurden erfolgreich hinzugefügt!")
