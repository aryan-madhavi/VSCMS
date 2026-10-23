from sqlalchemy import Column, Integer, Date, Numeric, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base

class Payment(Base):
    __tablename__ = "Payment"

    payment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    invoice_id = Column(Integer, ForeignKey("Invoice.invoice_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    payment_date = Column(Date, nullable=False, index=True)
    amount_paid = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(Enum("Cash", "Credit Card", "Debit Card", "UPI", "Bank Transfer", name="payment_method_enum"), nullable=False, default="Cash")
    transaction_reference = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
