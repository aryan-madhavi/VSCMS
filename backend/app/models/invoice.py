from sqlalchemy import Column, Integer, Date, Numeric, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base

class Invoice(Base):
    __tablename__ = "Invoice"

    invoice_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("Service_Booking.booking_id", ondelete="RESTRICT", onupdate="CASCADE"), unique=True, nullable=False, index=True)
    invoice_date = Column(Date, nullable=False, index=True)
    labor_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    parts_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0.00)
    status = Column(Enum("Unpaid", "Partially Paid", "Paid", name="invoice_status_enum"), nullable=False, default="Unpaid", index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    booking = relationship("ServiceBooking", back_populates="invoice")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
