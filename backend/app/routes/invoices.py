from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.models.invoice import Invoice
from app.models.service_booking import ServiceBooking
from app.models.payment import Payment
from app.schemas.invoice import InvoiceCreate, InvoiceResponse
from app.services.billing_service import calculate_and_generate_invoice, get_invoice_financial_summary

router = APIRouter(prefix="/invoices", tags=["Invoicing & Billing"])


@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by invoice payment status"),
    booking_id: Optional[int] = Query(None, description="Filter by booking ID"),
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    List invoices with payment progress, total paid, and balance due.
    """
    query = db.query(Invoice)
    if status_filter:
        query = query.filter(Invoice.status == status_filter)
    if booking_id:
        query = query.filter(Invoice.booking_id == booking_id)

    invoices = query.order_by(Invoice.invoice_id.desc()).all()
    results = []
    for inv in invoices:
        summary = get_invoice_financial_summary(db, inv)
        resp = InvoiceResponse(
            invoice_id=inv.invoice_id,
            booking_id=inv.booking_id,
            invoice_date=inv.invoice_date,
            labor_amount=inv.labor_amount,
            parts_amount=inv.parts_amount,
            tax_amount=inv.tax_amount,
            total_amount=inv.total_amount,
            status=inv.status,
            created_at=inv.created_at,
            updated_at=inv.updated_at,
            total_paid=summary["total_paid"],
            balance_due=summary["balance_due"]
        )
        if inv.booking and inv.booking.vehicle:
            v = inv.booking.vehicle
            resp.registration_number = v.registration_number
            resp.vehicle_info = f"{v.make} {v.model}"
            if v.customer:
                resp.customer_name = f"{v.customer.first_name} {v.customer.last_name}"
                resp.customer_phone = v.customer.phone
        results.append(resp)
    return results


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def generate_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Generate an invoice for a service booking.
    Calculates labor, parts, tax, and total atomically within a transaction.
    """
    inv = calculate_and_generate_invoice(
        db=db,
        booking_id=invoice_in.booking_id,
        invoice_date=invoice_in.invoice_date,
        tax_rate=invoice_in.tax_rate
    )
    summary = get_invoice_financial_summary(db, inv)
    resp = InvoiceResponse(
        invoice_id=inv.invoice_id,
        booking_id=inv.booking_id,
        invoice_date=inv.invoice_date,
        labor_amount=inv.labor_amount,
        parts_amount=inv.parts_amount,
        tax_amount=inv.tax_amount,
        total_amount=inv.total_amount,
        status=inv.status,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        total_paid=summary["total_paid"],
        balance_due=summary["balance_due"]
    )
    if inv.booking and inv.booking.vehicle:
        v = inv.booking.vehicle
        resp.registration_number = v.registration_number
        resp.vehicle_info = f"{v.make} {v.model}"
        if v.customer:
            resp.customer_name = f"{v.customer.first_name} {v.customer.last_name}"
            resp.customer_phone = v.customer.phone
    return resp


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Retrieve single invoice details and current balance due.
    """
    inv = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice ID {invoice_id} not found."
        )

    summary = get_invoice_financial_summary(db, inv)
    resp = InvoiceResponse(
        invoice_id=inv.invoice_id,
        booking_id=inv.booking_id,
        invoice_date=inv.invoice_date,
        labor_amount=inv.labor_amount,
        parts_amount=inv.parts_amount,
        tax_amount=inv.tax_amount,
        total_amount=inv.total_amount,
        status=inv.status,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        total_paid=summary["total_paid"],
        balance_due=summary["balance_due"]
    )
    if inv.booking and inv.booking.vehicle:
        v = inv.booking.vehicle
        resp.registration_number = v.registration_number
        resp.vehicle_info = f"{v.make} {v.model}"
        if v.customer:
            resp.customer_name = f"{v.customer.first_name} {v.customer.last_name}"
            resp.customer_phone = v.customer.phone
    return resp


@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Delete an invoice. Blocked if payment records exist.
    """
    inv = db.query(Invoice).filter(Invoice.invoice_id == invoice_id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice ID {invoice_id} not found."
        )

    if len(inv.payments) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete Invoice ID {invoice_id} because {len(inv.payments)} payment transaction(s) have been recorded for it."
        )

    db.delete(inv)
    db.commit()
    return {"message": f"Invoice ID {invoice_id} deleted successfully."}
