from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base

class ServiceType(Base):
    __tablename__ = "Service_Type"

    service_type_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type_name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    base_cost = Column(Numeric(10, 2), nullable=False, default=0.00)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    service_details = relationship("ServiceDetails", back_populates="service_type")
