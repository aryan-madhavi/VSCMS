from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Literal, List
from pydantic import BaseModel, Field

class InvoiceCreate(BaseModel):
    booking_id: int
    invoice_date: Optional[date] = None
    tax_rate: Decimal = Field(default=Decimal("0.18"), ge=Decimal("0.00"), le=Decimal("1.00"))

class InvoiceResponse(BaseModel):
    invoice_id: int
    booking_id: int
    invoice_date: date
    labor_amount: Decimal
    parts_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    status: Literal["Unpaid", "Partially Paid", "Paid"]
    created_at: datetime
    updated_at: datetime
    # Enriched fields
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    registration_number: Optional[str] = None
    vehicle_info: Optional[str] = None
    total_paid: Decimal = Decimal("0.00")
    balance_due: Decimal = Decimal("0.00")

    class Config:
        from_attributes = True
