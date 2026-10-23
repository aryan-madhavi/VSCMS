from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.invoice import Invoice
from app.models.service_booking import ServiceBooking
from app.models.service_details import ServiceDetails
from app.models.parts_used import PartsUsed
from app.models.payment import Payment

def calculate_and_generate_invoice(
    db: Session,
    booking_id: int,
    invoice_date: date = None,
    tax_rate: Decimal = Decimal("0.18")
) -> Invoice:
    """
    Computes labor and parts totals from service details and parts used,
    applies tax, and creates an atomic Invoice record.
    Enforces 1:1 Booking-to-Invoice constraint.
    """
    if invoice_date is None:
        invoice_date = date.today()

    booking = db.query(ServiceBooking).filter(ServiceBooking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service Booking ID {booking_id} not found."
        )

    # Check if an invoice already exists
    existing_invoice = db.query(Invoice).filter(Invoice.booking_id == booking_id).first()
    if existing_invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An invoice (ID {existing_invoice.invoice_id}) already exists for Booking {booking_id}."
        )

    # Compute Total Labor from Service_Details
    labor_sum = db.query(func.coalesce(func.sum(ServiceDetails.labor_cost), 0.00))\
        .filter(ServiceDetails.booking_id == booking_id).scalar()
    labor_amount = Decimal(str(labor_sum))

    # Compute Total Parts from Parts_Used across all details of this booking
    detail_ids = [d.service_detail_id for d in booking.service_details]
    if detail_ids:
        parts_sum = db.query(func.coalesce(func.sum(PartsUsed.quantity * PartsUsed.unit_price), 0.00))\
            .filter(PartsUsed.service_detail_id.in_(detail_ids)).scalar()
        parts_amount = Decimal(str(parts_sum))
    else:
        parts_amount = Decimal("0.00")

    # Calculate Tax (18%) and Grand Total
    subtotal = labor_amount + parts_amount
    tax_amount = (subtotal * tax_rate).quantize(Decimal("0.01"))
    total_amount = subtotal + tax_amount

    new_invoice = Invoice(
        booking_id=booking_id,
        invoice_date=invoice_date,
        labor_amount=labor_amount,
        parts_amount=parts_amount,
        tax_amount=tax_amount,
        total_amount=total_amount,
        status="Unpaid"
    )

    db.add(new_invoice)
    # Automatically ensure booking status reflects completed state
    if booking.status != "Completed":
        booking.status = "Completed"

    db.commit()
    db.refresh(new_invoice)
    return new_invoice


def get_invoice_financial_summary(db: Session, invoice: Invoice) -> dict:
    """
    Computes cumulative payments made and outstanding balance for an invoice.
    """
    paid_sum = db.query(func.coalesce(func.sum(Payment.amount_paid), 0.00))\
        .filter(Payment.invoice_id == invoice.invoice_id).scalar()
    total_paid = Decimal(str(paid_sum))
    balance_due = Decimal(str(invoice.total_amount)) - total_paid

    return {
        "total_paid": total_paid,
        "balance_due": max(Decimal("0.00"), balance_due)
    }
