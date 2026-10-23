from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class SparePartsBase(BaseModel):
    part_name: str = Field(..., min_length=2, max_length=100)
    part_number: str = Field(..., min_length=2, max_length=50)
    unit_price: Decimal = Field(..., ge=Decimal("0.00"))
    stock_quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=5, ge=0)

class SparePartsCreate(SparePartsBase):
    pass

class SparePartsUpdate(BaseModel):
    part_name: Optional[str] = Field(None, min_length=2, max_length=100)
    part_number: Optional[str] = Field(None, min_length=2, max_length=50)
    unit_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    stock_quantity: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)

class SparePartsResponse(SparePartsBase):
    part_id: int
    created_at: datetime
    updated_at: datetime
    is_low_stock: bool = False

    class Config:
        from_attributes = True
