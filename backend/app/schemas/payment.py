from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Literal
from pydantic import BaseModel, Field

class PaymentCreate(BaseModel):
    invoice_id: int
    payment_date: Optional[date] = None
    amount_paid: Decimal = Field(..., gt=Decimal("0.00"))
    payment_method: Literal["Cash", "Credit Card", "Debit Card", "UPI", "Bank Transfer"] = "Cash"
    transaction_reference: Optional[str] = Field(None, max_length=100)

class PaymentResponse(BaseModel):
    payment_id: int
    invoice_id: int
    payment_date: date
    amount_paid: Decimal
    payment_method: str
    transaction_reference: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
