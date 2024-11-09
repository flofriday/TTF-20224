from pydantic import BaseModel


class SkiLiftBase(BaseModel):
    name: str
    capacity: int
    current_load: int
    description: str
    image_url: str
    webcam_url: str


class SkiLift(SkiLiftBase):
    id: int

    class Config:
        from_attributes = True
