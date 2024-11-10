from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class SkiLift(Base):
    __tablename__ = "ski_lifts"

    id = Column(Integer, primary_key=True, index=True)
    resort_id = Column(Integer, ForeignKey("ski_resorts.id"))
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

    ski_resort = relationship("SkiResort", back_populates="ski_lifts")


class SkiResort(Base):
    __tablename__ = "ski_resorts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    location = Column(String)
    description = Column(String)
    image_url = Column(String)
    website_url = Column(String)
    status = Column(String)  # 'open', 'closed', 'partial'
    snow_depth = Column(Integer)  # in cm
    weather_conditions = Column(String)
    total_lifts = Column(Integer)
    open_lifts = Column(Integer)
    ski_lifts = relationship("SkiLift", back_populates="ski_resort")
    huts = relationship("SkiHut", back_populates="resort")


class SkiHut(Base):
    __tablename__ = "ski_huts"

    id = Column(Integer, primary_key=True, index=True)
    resort_id = Column(Integer, ForeignKey("ski_resorts.id"))
    name = Column(String)
    type = Column(String)  # restaurant, cafe, bar, etc.
    description = Column(String)
    free_seats = Column(Integer)
    status = Column(String)
    coordinates = Column(String)  # JSON string of [x, y] pixel coordinates
    elevation = Column(Float)

    resort = relationship("SkiResort", back_populates="huts")
