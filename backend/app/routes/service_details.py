from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.models.service_details import ServiceDetails
from app.models.service_booking import ServiceBooking
from app.models.service_type import ServiceType
from app.models.mechanic import Mechanic
from app.models.parts_used import PartsUsed
from app.schemas.service_details import (
    ServiceDetailsCreate,
    ServiceDetailsUpdate,
    ServiceDetailsResponse
)

router = APIRouter(prefix="/service-details", tags=["Service Details"])


@router.get("", response_model=List[ServiceDetailsResponse])
def list_service_details(
    booking_id: Optional[int] = Query(None, description="Filter line items by booking ID"),
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    List service detail line items assigned under bookings.
    """
    query = db.query(ServiceDetails)
    if booking_id:
        query = query.filter(ServiceDetails.booking_id == booking_id)

    details = query.order_by(ServiceDetails.service_detail_id.asc()).all()
    results = []
    for d in details:
        resp = ServiceDetailsResponse.model_validate(d)
        if d.service_type:
            resp.service_type_name = d.service_type.type_name
        if d.mechanic:
            resp.mechanic_name = d.mechanic.name

        # Calculate parts sum for this detail item
        parts_sum = db.query(func.coalesce(func.sum(PartsUsed.quantity * PartsUsed.unit_price), 0.00))\
            .filter(PartsUsed.service_detail_id == d.service_detail_id).scalar()
        resp.total_parts_cost = Decimal(str(parts_sum))
        results.append(resp)
    return results


@router.post("", response_model=ServiceDetailsResponse, status_code=status.HTTP_201_CREATED)
def create_service_detail(
    detail_in: ServiceDetailsCreate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Assign a service task and technician to a booking.
    Defaults labor cost to the Service_Type base_cost if 0.00.
    """
    booking = db.query(ServiceBooking).filter(ServiceBooking.booking_id == detail_in.booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service Booking ID {detail_in.booking_id} not found."
        )

    st = db.query(ServiceType).filter(ServiceType.service_type_id == detail_in.service_type_id).first()
    if not st:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service Type ID {detail_in.service_type_id} not found."
        )

    mechanic = db.query(Mechanic).filter(Mechanic.mechanic_id == detail_in.mechanic_id).first()
    if not mechanic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mechanic ID {detail_in.mechanic_id} not found."
        )

    # Use service type base cost if labor_cost is not explicitly set or is 0
    labor_cost = detail_in.labor_cost
    if labor_cost == Decimal("0.00") and st.base_cost > Decimal("0.00"):
        labor_cost = st.base_cost

    detail = ServiceDetails(
        booking_id=detail_in.booking_id,
        service_type_id=detail_in.service_type_id,
        mechanic_id=detail_in.mechanic_id,
        labor_cost=labor_cost,
        service_notes=detail_in.service_notes,
        status=detail_in.status
    )
    db.add(detail)

    # Advance booking status to 'In Progress' if currently 'Pending'
    if booking.status == "Pending":
        booking.status = "In Progress"

    db.commit()
    db.refresh(detail)

    resp = ServiceDetailsResponse.model_validate(detail)
    resp.service_type_name = st.type_name
    resp.mechanic_name = mechanic.name
    resp.total_parts_cost = Decimal("0.00")
    return resp


@router.get("/{service_detail_id}", response_model=ServiceDetailsResponse)
def get_service_detail(
    service_detail_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Retrieve single service detail item.
    """
    detail = db.query(ServiceDetails).filter(ServiceDetails.service_detail_id == service_detail_id).first()
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service Detail ID {service_detail_id} not found."
        )
    resp = ServiceDetailsResponse.model_validate(detail)
    if detail.service_type:
        resp.service_type_name = detail.service_type.type_name
    if detail.mechanic:
        resp.mechanic_name = detail.mechanic.name

    parts_sum = db.query(func.coalesce(func.sum(PartsUsed.quantity * PartsUsed.unit_price), 0.00))\
        .filter(PartsUsed.service_detail_id == detail.service_detail_id).scalar()
    resp.total_parts_cost = Decimal(str(parts_sum))
    return resp


@router.put("/{service_detail_id}", response_model=ServiceDetailsResponse)
def update_service_detail(
    service_detail_id: int,
    detail_in: ServiceDetailsUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Update service task notes, labor cost, or progress status.
    """
    detail = db.query(ServiceDetails).filter(ServiceDetails.service_detail_id == service_detail_id).first()
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service Detail ID {service_detail_id} not found."
        )

    if detail_in.service_type_id is not None:
        st = db.query(ServiceType).filter(ServiceType.service_type_id == detail_in.service_type_id).first()
        if not st:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service Type not found.")
        detail.service_type_id = detail_in.service_type_id

    if detail_in.mechanic_id is not None:
        mech = db.query(Mechanic).filter(Mechanic.mechanic_id == detail_in.mechanic_id).first()
        if not mech:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mechanic not found.")
        detail.mechanic_id = detail_in.mechanic_id

    if detail_in.labor_cost is not None:
        detail.labor_cost = detail_in.labor_cost
    if detail_in.service_notes is not None:
        detail.service_notes = detail_in.service_notes
    if detail_in.status is not None:
        detail.status = detail_in.status

    db.commit()
    db.refresh(detail)

    resp = ServiceDetailsResponse.model_validate(detail)
    if detail.service_type:
        resp.service_type_name = detail.service_type.type_name
    if detail.mechanic:
        resp.mechanic_name = detail.mechanic.name

    parts_sum = db.query(func.coalesce(func.sum(PartsUsed.quantity * PartsUsed.unit_price), 0.00))\
        .filter(PartsUsed.service_detail_id == detail.service_detail_id).scalar()
    resp.total_parts_cost = Decimal(str(parts_sum))
    return resp


@router.delete("/{service_detail_id}")
def delete_service_detail(
    service_detail_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Delete a service detail line item. Cascade will remove associated Parts_Used records
    and triggers will restore spare parts stock!
    """
    detail = db.query(ServiceDetails).filter(ServiceDetails.service_detail_id == service_detail_id).first()
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service Detail ID {service_detail_id} not found."
        )

    db.delete(detail)
    db.commit()
    return {"message": f"Service Detail ID {service_detail_id} deleted successfully."}
