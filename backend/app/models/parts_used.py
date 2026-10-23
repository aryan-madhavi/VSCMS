from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base

class PartsUsed(Base):
    __tablename__ = "Parts_Used"

    usage_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    service_detail_id = Column(Integer, ForeignKey("Service_Details.service_detail_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, index=True)
    part_id = Column(Integer, ForeignKey("Spare_Parts.part_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    service_detail = relationship("ServiceDetails", back_populates="parts_used")
    part = relationship("SpareParts", back_populates="parts_used")
