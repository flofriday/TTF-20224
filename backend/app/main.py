from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import json
from . import models, schemas, database
from typing import List

app = FastAPI()


@app.get("/ski-lifts", response_model=List[schemas.SkiLift])
def get_ski_lifts(db: Session = Depends(database.get_db)):
    lifts = db.query(models.SkiLift).all()
    # Parse the JSON string back into a list for each lift
    for lift in lifts:
        lift.path = json.loads(lift.path)
    return lifts
