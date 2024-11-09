from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from typing import List
import json
from . import database
from . import models
from . import schemas
import os
from sqlalchemy.orm import Session

app = FastAPI()


@app.get("/ski-lifts", response_model=List[schemas.SkiLift])
def get_ski_lifts(db: Session = Depends(database.get_db)):
    lifts = db.query(models.SkiLift).all()
    # Parse the JSON string back into a list for each lift
    for lift in lifts:
        lift.path = json.loads(lift.path)
    return lifts


@app.get("/ski-map")
def get_ski_map():
    map_path = os.path.join("data", "ski_map.png")
    if not os.path.exists(map_path):
        raise HTTPException(status_code=404, detail="Ski map not found")
    return FileResponse(map_path)
