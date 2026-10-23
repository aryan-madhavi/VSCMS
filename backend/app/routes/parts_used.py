from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError, IntegrityError, OperationalError
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.models.parts_used import PartsUsed
from app.models.service_details import ServiceDetails
from app.models.spare_parts import SpareParts
from app.schemas.parts_used import PartsUsedCreate, PartsUsedUpdate, PartsUsedResponse

router = APIRouter(prefix="/parts-used", tags=["Parts Used (Trigger-Driven Stock Management)"])


@router.get("", response_model=List[PartsUsedResponse])
def list_parts_used(
    service_detail_id: Optional[int] = Query(None, description="Filter by service detail item ID"),
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    List installed spare parts with calculated line costs.
    """
    query = db.query(PartsUsed)
    if service_detail_id:
        query = query.filter(PartsUsed.service_detail_id == service_detail_id)

    records = query.order_by(PartsUsed.usage_id.asc()).all()
    results = []
    for r in records:
        resp = PartsUsedResponse(
            usage_id=r.usage_id,
            service_detail_id=r.service_detail_id,
            part_id=r.part_id,
            part_name=r.part.part_name if r.part else None,
            part_number=r.part.part_number if r.part else None,
            quantity=r.quantity,
            unit_price=r.unit_price,
            total_cost=(Decimal(str(r.quantity)) * Decimal(str(r.unit_price))),
            created_at=r.created_at
        )
        results.append(resp)
    return results


@router.post("", response_model=PartsUsedResponse, status_code=status.HTTP_201_CREATED)
def record_parts_used(
    usage_in: PartsUsedCreate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Log spare parts installed in a service.
    NOTE: Database trigger 'trg_parts_used_before_insert' verifies stock availability,
    and 'trg_parts_used_after_insert' atomically decrements inventory!
    """
    detail = db.query(ServiceDetails).filter(ServiceDetails.service_detail_id == usage_in.service_detail_id).first()
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service Detail ID {usage_in.service_detail_id} not found."
        )

    part = db.query(SpareParts).filter(SpareParts.part_id == usage_in.part_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Spare Part ID {usage_in.part_id} not found."
        )

    unit_price = usage_in.unit_price if usage_in.unit_price is not None else part.unit_price

    usage_record = PartsUsed(
        service_detail_id=usage_in.service_detail_id,
        part_id=usage_in.part_id,
        quantity=usage_in.quantity,
        unit_price=unit_price
    )
    db.add(usage_record)

    try:
        db.commit()
    except DBAPIError as e:
        db.rollback()
        error_msg = str(e.orig)
        # Parse trigger error text if raised
        if "Insufficient stock" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Database Trigger Validation Failed: Insufficient stock for '{part.part_name}' (Current stock: {part.stock_quantity}, Requested: {usage_in.quantity})."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error executing parts insertion: {error_msg}"
        )

    db.refresh(usage_record)
    return PartsUsedResponse(
        usage_id=usage_record.usage_id,
        service_detail_id=usage_record.service_detail_id,
        part_id=usage_record.part_id,
        part_name=part.part_name,
        part_number=part.part_number,
        quantity=usage_record.quantity,
        unit_price=usage_record.unit_price,
        total_cost=(Decimal(str(usage_record.quantity)) * Decimal(str(usage_record.unit_price))),
        created_at=usage_record.created_at
    )


@router.delete("/{usage_id}")
def delete_parts_used(
    usage_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Remove a parts usage record.
    NOTE: Database trigger 'trg_parts_used_after_delete' atomically restores inventory!
    """
    record = db.query(PartsUsed).filter(PartsUsed.usage_id == usage_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parts Usage record ID {usage_id} not found."
        )

    part_name = record.part.part_name if record.part else f"Part ID {record.part_id}"
    qty = record.quantity

    db.delete(record)
    db.commit()

    return {
        "message": f"Parts usage record ID {usage_id} deleted successfully. Trigger restored {qty} unit(s) of '{part_name}' back to inventory."
    }
