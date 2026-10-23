from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class PartsUsedBase(BaseModel):
    service_detail_id: int
    part_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Optional[Decimal] = Field(default=None, ge=Decimal("0.00"))

class PartsUsedCreate(PartsUsedBase):
    pass

class PartsUsedUpdate(BaseModel):
    quantity: Optional[int] = Field(None, gt=0)
    unit_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))

class PartsUsedResponse(BaseModel):
    usage_id: int
    service_detail_id: int
    part_id: int
    part_name: Optional[str] = None
    part_number: Optional[str] = None
    quantity: int
    unit_price: Decimal
    total_cost: Decimal
    created_at: datetime

    class Config:
        from_attributes = True
