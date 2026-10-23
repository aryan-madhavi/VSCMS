from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel

class BookingBase(BaseModel):
    vehicle_id: int
    booking_date: date
    status: Literal["Pending", "In Progress", "Completed", "Cancelled"] = "Pending"
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    booking_date: Optional[date] = None
    status: Optional[Literal["Pending", "In Progress", "Completed", "Cancelled"]] = None
    notes: Optional[str] = None

class BookingResponse(BookingBase):
    booking_id: int
    created_at: datetime
    updated_at: datetime
    registration_number: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    has_invoice: bool = False
    invoice_id: Optional[int] = None

    class Config:
        from_attributes = True
