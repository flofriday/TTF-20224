from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class SkiLift(Base):
    __tablename__ = "ski_lifts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    capacity = Column(Integer)
    current_load = Column(Integer)
    description = Column(String)
    image_url = Column(String)
    webcam_url = Column(String)
    status = Column(String)  # 'open', 'closed', 'hold'
    type = Column(String)  # 'express', 'quad', 'magic-carpet'
    difficulty = Column(String)  # 'beginner', 'intermediate', 'advanced'
    path = Column(String)  # JSON string of coordinates
    wait_time = Column(Integer)
