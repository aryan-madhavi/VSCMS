from sqlalchemy import Column, Integer, Numeric, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base

class ServiceDetails(Base):
    __tablename__ = "Service_Details"

    service_detail_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("Service_Booking.booking_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    service_type_id = Column(Integer, ForeignKey("Service_Type.service_type_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    mechanic_id = Column(Integer, ForeignKey("Mechanic.mechanic_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    labor_cost = Column(Numeric(10, 2), nullable=False, default=0.00)
    service_notes = Column(Text, nullable=True)
    status = Column(Enum("Pending", "In Progress", "Completed", name="service_detail_status_enum"), nullable=False, default="Pending")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    booking = relationship("ServiceBooking", back_populates="service_details")
    service_type = relationship("ServiceType", back_populates="service_details")
    mechanic = relationship("Mechanic", back_populates="service_details")
    parts_used = relationship("PartsUsed", back_populates="service_detail", cascade="all, delete-orphan")
