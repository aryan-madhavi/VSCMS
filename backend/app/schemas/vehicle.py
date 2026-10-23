from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class VehicleBase(BaseModel):
    customer_id: int
    registration_number: str = Field(..., min_length=3, max_length=20)
    make: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=50)
    year: int = Field(..., ge=1970, le=2100)
    color: Optional[str] = Field(None, max_length=30)

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    customer_id: Optional[int] = None
    registration_number: Optional[str] = Field(None, min_length=3, max_length=20)
    make: Optional[str] = Field(None, min_length=1, max_length=50)
    model: Optional[str] = Field(None, min_length=1, max_length=50)
    year: Optional[int] = Field(None, ge=1970, le=2100)
    color: Optional[str] = Field(None, max_length=30)

class VehicleResponse(VehicleBase):
    vehicle_id: int
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True
