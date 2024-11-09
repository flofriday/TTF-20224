from pydantic import BaseModel
from typing import List


class SkiLiftBase(BaseModel):
    name: str
    capacity: int
    current_load: int
    description: str
    image_url: str
    webcam_url: str
    status: str
    type: str
    difficulty: str
    path: List[List[float]]
    wait_time: int

    class Config:
        from_attributes = True


class SkiLift(SkiLiftBase):
    id: int
