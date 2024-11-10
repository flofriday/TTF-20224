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


class SkiHutBase(BaseModel):
    name: str
    resort_id: int
    type: str
    description: str
    status: str
    coordinates: str  # JSON string of [x, y] pixel coordinates
    elevation: float
    free_seats: int

    class Config:
        from_attributes = True


class SkiHut(SkiHutBase):
    id: int
