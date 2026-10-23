from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin, require_admin
from app.models.spare_parts import SpareParts
from app.schemas.spare_parts import SparePartsCreate, SparePartsUpdate, SparePartsResponse

router = APIRouter(prefix="/spare-parts", tags=["Spare Parts Catalog & Inventory"])


@router.get("", response_model=List[SparePartsResponse])
def list_spare_parts(
    search: Optional[str] = Query(None, description="Search by part name or part number"),
    low_stock_only: bool = Query(False, description="Filter only items at or below reorder level"),
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    List spare parts catalog with inventory levels and low-stock flagging.
    """
    query = db.query(SpareParts)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                SpareParts.part_name.ilike(pattern),
                SpareParts.part_number.ilike(pattern)
            )
        )
    if low_stock_only:
        query = query.filter(SpareParts.stock_quantity <= SpareParts.reorder_level)

    parts = query.order_by(SpareParts.part_name.asc()).all()
    results = []
    for p in parts:
        resp = SparePartsResponse.model_validate(p)
        resp.is_low_stock = (p.stock_quantity <= p.reorder_level)
        results.append(resp)
    return results


@router.post("", response_model=SparePartsResponse, status_code=status.HTTP_201_CREATED)
def create_spare_part(
    part_in: SparePartsCreate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Add a new spare part item to the catalog.
    """
    part_num = part_in.part_number.strip().upper()
    existing = db.query(SpareParts).filter(SpareParts.part_number == part_num).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Part with number '{part_num}' already exists in inventory."
        )

    part = SpareParts(
        part_name=part_in.part_name.strip(),
        part_number=part_num,
        unit_price=part_in.unit_price,
        stock_quantity=part_in.stock_quantity,
        reorder_level=part_in.reorder_level
    )
    db.add(part)
    db.commit()
    db.refresh(part)

    resp = SparePartsResponse.model_validate(part)
    resp.is_low_stock = (part.stock_quantity <= part.reorder_level)
    return resp


@router.get("/{part_id}", response_model=SparePartsResponse)
def get_spare_part(
    part_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Retrieve single spare part details.
    """
    part = db.query(SpareParts).filter(SpareParts.part_id == part_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Spare Part ID {part_id} not found."
        )
    resp = SparePartsResponse.model_validate(part)
    resp.is_low_stock = (part.stock_quantity <= part.reorder_level)
    return resp


@router.put("/{part_id}", response_model=SparePartsResponse)
def update_spare_part(
    part_id: int,
    part_in: SparePartsUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Update part details, unit price, stock count, or reorder threshold.
    """
    part = db.query(SpareParts).filter(SpareParts.part_id == part_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Spare Part ID {part_id} not found."
        )

    if part_in.part_number:
        part_num = part_in.part_number.strip().upper()
        if part_num != part.part_number:
            existing = db.query(SpareParts).filter(SpareParts.part_number == part_num).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Part number '{part_num}' is already in use."
                )
            part.part_number = part_num

    if part_in.part_name is not None:
        part.part_name = part_in.part_name.strip()
    if part_in.unit_price is not None:
        part.unit_price = part_in.unit_price
    if part_in.stock_quantity is not None:
        part.stock_quantity = part_in.stock_quantity
    if part_in.reorder_level is not None:
        part.reorder_level = part_in.reorder_level

    db.commit()
    db.refresh(part)

    resp = SparePartsResponse.model_validate(part)
    resp.is_low_stock = (part.stock_quantity <= part.reorder_level)
    return resp


@router.delete("/{part_id}")
def delete_spare_part(
    part_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_admin)  # Admin only deletes inventory items
):
    """
    Delete spare part item. Blocked if part has been used in service records.
    """
    part = db.query(SpareParts).filter(SpareParts.part_id == part_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Spare Part ID {part_id} not found."
        )

    if len(part.parts_used) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete Part '{part.part_name}' because it has {len(part.parts_used)} service usage history record(s)."
        )

    db.delete(part)
    db.commit()
    return {"message": f"Spare Part '{part.part_name}' deleted successfully."}
