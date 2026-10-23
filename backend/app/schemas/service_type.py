from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class ServiceTypeBase(BaseModel):
    type_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    base_cost: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))

class ServiceTypeCreate(ServiceTypeBase):
    pass

class ServiceTypeUpdate(BaseModel):
    type_name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    base_cost: Optional[Decimal] = Field(None, ge=Decimal("0.00"))

class ServiceTypeResponse(ServiceTypeBase):
    service_type_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
