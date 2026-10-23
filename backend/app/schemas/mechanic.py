from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class MechanicBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    specialization: str = Field(..., min_length=2, max_length=100)
    is_active: bool = True

class MechanicCreate(MechanicBase):
    pass

class MechanicUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    specialization: Optional[str] = Field(None, min_length=2, max_length=100)
    is_active: Optional[bool] = None

class MechanicResponse(MechanicBase):
    mechanic_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
