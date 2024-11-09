from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from . import models, schemas, database
from typing import List

app = FastAPI()


@app.get("/ski-lifts/", response_model=List[schemas.SkiLift])
def get_ski_lifts(db: Session = Depends(database.get_db)):
    return db.query(models.SkiLift).all()
