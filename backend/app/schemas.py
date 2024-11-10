from pydantic import BaseModel
from typing import List


class SkiLiftBase(BaseModel):
    name: str
    resort_id: int
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


class SkiResortBase(BaseModel):
    name: str
    location: str
    description: str
    image_url: str
    website_url: str
    status: str
    snow_depth: int
    weather_conditions: str
    total_lifts: int
    open_lifts: int

    class Config:
        from_attributes = True


class SkiResort(SkiResortBase):
    id: int
