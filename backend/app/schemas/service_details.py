from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal, List
from pydantic import BaseModel, Field

class ServiceDetailsBase(BaseModel):
    booking_id: int
    service_type_id: int
    mechanic_id: int
    labor_cost: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    service_notes: Optional[str] = None
    status: Literal["Pending", "In Progress", "Completed"] = "Pending"

class ServiceDetailsCreate(ServiceDetailsBase):
    pass

class ServiceDetailsUpdate(BaseModel):
    service_type_id: Optional[int] = None
    mechanic_id: Optional[int] = None
    labor_cost: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    service_notes: Optional[str] = None
    status: Optional[Literal["Pending", "In Progress", "Completed"]] = None

class ServiceDetailsResponse(ServiceDetailsBase):
    service_detail_id: int
    created_at: datetime
    updated_at: datetime
    service_type_name: Optional[str] = None
    mechanic_name: Optional[str] = None
    total_parts_cost: Decimal = Decimal("0.00")

    class Config:
        from_attributes = True
