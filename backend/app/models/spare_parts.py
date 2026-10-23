from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base

class SpareParts(Base):
    __tablename__ = "Spare_Parts"

    part_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    part_name = Column(String(100), nullable=False)
    part_number = Column(String(50), unique=True, nullable=False, index=True)
    unit_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    stock_quantity = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=5)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    parts_used = relationship("PartsUsed", back_populates="part")
