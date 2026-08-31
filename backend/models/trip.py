from sqlalchemy import BigInteger, Column, ForeignKey, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Trip(Base):
    __tablename__ = "trips"
    id                  = Column(Integer, primary_key=True, index=True)
    user_id             = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    destination         = Column(String, nullable=False)
    days                = Column(Integer, nullable=False)
    budget              = Column(Float, nullable=False)
    category            = Column(String, nullable=False)
    daily_budget        = Column(Float, nullable=False)
    travel_style        = Column(String, nullable=True)
    ai_recommendation   = Column(Text, nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="trips")