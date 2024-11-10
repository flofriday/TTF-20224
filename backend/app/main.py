from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from typing import List
import json
from . import database
from . import models
from . import schemas
import os
from sqlalchemy.orm import Session
import base64
from .person_detection import detect_objects_from_base64

app = FastAPI()


@app.get("/ski-resorts", response_model=List[schemas.SkiResort])
def get_ski_resorts(db: Session = Depends(database.get_db)):
    return db.query(models.SkiResort).all()


@app.get("/ski-resorts/{resort_id}", response_model=schemas.SkiResort)
def get_ski_resort(resort_id: int, db: Session = Depends(database.get_db)):
    resort = db.query(models.SkiResort).filter(models.SkiResort.id == resort_id).first()
    if resort is None:
        raise HTTPException(status_code=404, detail="Ski resort not found")
    return resort


@app.post("/ski-resorts", response_model=schemas.SkiResort)
def create_ski_resort(
    resort: schemas.SkiResortBase, db: Session = Depends(database.get_db)
):
    db_resort = models.SkiResort(**resort.dict())
    db.add(db_resort)
    db.commit()
    db.refresh(db_resort)
    return db_resort


@app.put("/ski-resorts/{resort_id}", response_model=schemas.SkiResort)
def update_ski_resort(
    resort_id: int,
    resort: schemas.SkiResortBase,
    db: Session = Depends(database.get_db),
):
    db_resort = (
        db.query(models.SkiResort).filter(models.SkiResort.id == resort_id).first()
    )
    if db_resort is None:
        raise HTTPException(status_code=404, detail="Ski resort not found")

    for key, value in resort.dict().items():
        setattr(db_resort, key, value)

    db.commit()
    db.refresh(db_resort)
    return db_resort


@app.delete("/ski-resorts/{resort_id}")
def delete_ski_resort(resort_id: int, db: Session = Depends(database.get_db)):
    db_resort = (
        db.query(models.SkiResort).filter(models.SkiResort.id == resort_id).first()
    )
    if db_resort is None:
        raise HTTPException(status_code=404, detail="Ski resort not found")

    db.delete(db_resort)
    db.commit()
    return {"message": "Ski resort deleted successfully"}


@app.get("/ski-maps/{map_file}")
def get_ski_map(map_file: str):
    map_path = os.path.join("data", "ski-maps", map_file)
    if not os.path.exists(map_path):
        raise HTTPException(status_code=404, detail="Ski map not found")
    return FileResponse(map_path)


@app.get("/ski-resorts/{resort_id}/lifts", response_model=List[schemas.SkiLift])
def get_resort_lifts(resort_id: int, db: Session = Depends(database.get_db)):
    lifts = db.query(models.SkiLift).filter(models.SkiLift.resort_id == resort_id).all()
    for lift in lifts:
        lift.path = json.loads(lift.path)
    return lifts


@app.get("/ski-resorts/{resort_id}/map")
def get_resort_map(resort_id: int):
    map_path = os.path.join("data", f"ski_map_{resort_id}.png")
    if not os.path.exists(map_path):
        raise HTTPException(status_code=404, detail="Ski map not found")
    return FileResponse(map_path)


@app.post("/detect-people")
async def detect_people(image: dict):
    try:
        if "base64" not in image:
            raise HTTPException(status_code=400, detail="No base64 image provided")

        base64_image = image["base64"]
        confidence_threshold = image.get("confidence_threshold", 0.01)

        # Process image
        annotated_image, counts = detect_objects_from_base64(
            base64_image, confidence_threshold
        )

        return {"annotated_image": annotated_image, "counts": counts}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
