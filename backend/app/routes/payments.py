from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.models.payment import Payment
from app.models.invoice import Invoice
from app.schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["Payment Processing"])


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    invoice_id: Optional[int] = Query(None, description="Filter payments by invoice ID"),
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    List all recorded customer payments with optional invoice filtering.
    """
    query = db.query(Payment)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    return query.order_by(Payment.payment_date.desc(), Payment.payment_id.desc()).all()


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Record a customer payment against an invoice.
    NOTE: Database trigger 'trg_payment_after_insert' automatically synchronizes
    the invoice status ('Unpaid' -> 'Partially Paid' -> 'Paid')!
    """
    inv = db.query(Invoice).filter(Invoice.invoice_id == payment_in.invoice_id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice ID {payment_in.invoice_id} not found."
        )

    payment_date = payment_in.payment_date if payment_in.payment_date else date.today()

    payment = Payment(
        invoice_id=payment_in.invoice_id,
        payment_date=payment_date,
        amount_paid=payment_in.amount_paid,
        payment_method=payment_in.payment_method,
        transaction_reference=payment_in.transaction_reference
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Void/delete a payment record.
    NOTE: Database trigger 'trg_payment_after_delete' automatically recalculates
    and updates the invoice status!
    """
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment ID {payment_id} not found."
        )

    inv_id = payment.invoice_id
    db.delete(payment)
    db.commit()

    return {
        "message": f"Payment ID {payment_id} removed successfully. Invoice ID {inv_id} status updated by trigger."
    }
