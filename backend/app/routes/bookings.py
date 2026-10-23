from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.models.service_booking import ServiceBooking
from app.models.vehicle import Vehicle
from app.models.invoice import Invoice
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse

router = APIRouter(prefix="/bookings", tags=["Service Bookings"])


@router.get("", response_model=List[BookingResponse])
def list_bookings(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by booking status"),
    vehicle_id: Optional[int] = Query(None, description="Filter by vehicle ID"),
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    List all service bookings with vehicle and customer enrichment.
    """
    query = db.query(ServiceBooking)
    if status_filter:
        query = query.filter(ServiceBooking.status == status_filter)
    if vehicle_id:
        query = query.filter(ServiceBooking.vehicle_id == vehicle_id)

    bookings = query.order_by(ServiceBooking.booking_date.desc(), ServiceBooking.booking_id.desc()).all()
    results = []
    for b in bookings:
        resp = BookingResponse.model_validate(b)
        if b.vehicle:
            resp.registration_number = b.vehicle.registration_number
            if b.vehicle.customer:
                resp.customer_name = f"{b.vehicle.customer.first_name} {b.vehicle.customer.last_name}"
                resp.customer_phone = b.vehicle.customer.phone
        if b.invoice:
            resp.has_invoice = True
            resp.invoice_id = b.invoice.invoice_id
        results.append(resp)
    return results


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Create a new service booking appointment for a registered vehicle.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == booking_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle ID {booking_in.vehicle_id} not found."
        )

    booking = ServiceBooking(
        vehicle_id=booking_in.vehicle_id,
        booking_date=booking_in.booking_date,
        status=booking_in.status,
        notes=booking_in.notes
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    resp = BookingResponse.model_validate(booking)
    resp.registration_number = vehicle.registration_number
    if vehicle.customer:
        resp.customer_name = f"{vehicle.customer.first_name} {vehicle.customer.last_name}"
        resp.customer_phone = vehicle.customer.phone
    return resp


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Retrieve single booking details.
    """
    booking = db.query(ServiceBooking).filter(ServiceBooking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking ID {booking_id} not found."
        )

    resp = BookingResponse.model_validate(booking)
    if booking.vehicle:
        resp.registration_number = booking.vehicle.registration_number
        if booking.vehicle.customer:
            resp.customer_name = f"{booking.vehicle.customer.first_name} {booking.vehicle.customer.last_name}"
            resp.customer_phone = booking.vehicle.customer.phone
    if booking.invoice:
        resp.has_invoice = True
        resp.invoice_id = booking.invoice.invoice_id
    return resp


@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    booking_in: BookingUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Update booking details or transition status (Pending -> In Progress -> Completed -> Cancelled).
    """
    booking = db.query(ServiceBooking).filter(ServiceBooking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking ID {booking_id} not found."
        )

    if booking_in.vehicle_id is not None and booking_in.vehicle_id != booking.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == booking_in.vehicle_id).first()
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle ID {booking_in.vehicle_id} not found."
            )
        booking.vehicle_id = booking_in.vehicle_id

    if booking_in.booking_date is not None:
        booking.booking_date = booking_in.booking_date
    if booking_in.status is not None:
        booking.status = booking_in.status
    if booking_in.notes is not None:
        booking.notes = booking_in.notes

    db.commit()
    db.refresh(booking)

    resp = BookingResponse.model_validate(booking)
    if booking.vehicle:
        resp.registration_number = booking.vehicle.registration_number
        if booking.vehicle.customer:
            resp.customer_name = f"{booking.vehicle.customer.first_name} {booking.vehicle.customer.last_name}"
            resp.customer_phone = booking.vehicle.customer.phone
    if booking.invoice:
        resp.has_invoice = True
        resp.invoice_id = booking.invoice.invoice_id
    return resp


@router.delete("/{booking_id}")
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Delete a booking. Blocked if an invoice has already been issued.
    """
    booking = db.query(ServiceBooking).filter(ServiceBooking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking ID {booking_id} not found."
        )

    if booking.invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete Booking ID {booking_id} because Invoice ID {booking.invoice.invoice_id} has been generated for it."
        )

    db.delete(booking)
    db.commit()
    return {"message": f"Service Booking ID {booking_id} deleted successfully."}
