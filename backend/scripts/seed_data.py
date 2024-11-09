import sys
import os
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from app.models import Base, SkiLift


def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    example_lifts = [
        {
            "name": "Blue Mountain Express",
            "capacity": 2400,
            "current_load": 1200,
            "description": "High-speed express lift",
            "image_url": "https://example.com/blue-mountain.jpg",
            "webcam_url": "https://example.com/webcam/blue-mountain",
            "status": "open",
            "type": "express",
            "difficulty": "intermediate",
            "path": json.dumps([[120, 150], [180, 80], [250, 50]]),
            "wait_time": 5,
        },
        {
            "name": "Summit Quad",
            "capacity": 1800,
            "current_load": 900,
            "description": "Quad lift to the summit",
            "image_url": "https://example.com/summit.jpg",
            "webcam_url": "https://example.com/webcam/summit",
            "status": "open",
            "type": "quad",
            "difficulty": "advanced",
            "path": json.dumps([[250, 200], [250, 150], [350, 100]]),
            "wait_time": 12,
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
