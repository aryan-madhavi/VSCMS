from sqlalchemy import Column, Integer, Date, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base

class ServiceBooking(Base):
    __tablename__ = "Service_Booking"

    booking_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("Vehicle.vehicle_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    booking_date = Column(Date, nullable=False, index=True)
    status = Column(Enum("Pending", "In Progress", "Completed", "Cancelled", name="booking_status_enum"), nullable=False, default="Pending", index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="bookings")
    service_details = relationship("ServiceDetails", back_populates="booking", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="booking", uselist=False)
