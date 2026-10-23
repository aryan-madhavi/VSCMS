from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.schemas.reports import (
    ServiceHistoryReportItem,
    LowStockReportItem,
    OutstandingBalanceReportItem,
    ServiceSummaryReport
)

router = APIRouter(prefix="/reports", tags=["Analytical Reports & SQL Views"])


@router.get("/service-history", response_model=List[ServiceHistoryReportItem])
def get_service_history_report(
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Query database view 'view_service_history'.
    Returns unified lifecycle records for customer vehicles and services.
    """
    sql = text("SELECT * FROM `view_service_history` ORDER BY booking_id DESC, service_detail_id ASC")
    rows = db.execute(sql).mappings().all()
    return [ServiceHistoryReportItem(**dict(row)) for row in rows]


@router.get("/low-stock", response_model=List[LowStockReportItem])
def get_low_stock_report(
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Query database view 'view_low_stock_alerts'.
    Identifies inventory items below or at their reorder levels.
    """
    sql = text("SELECT * FROM `view_low_stock_alerts`")
    rows = db.execute(sql).mappings().all()
    return [LowStockReportItem(**dict(row)) for row in rows]


@router.get("/outstanding-balances", response_model=List[OutstandingBalanceReportItem])
def get_outstanding_balances_report(
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Query database view 'view_outstanding_balances'.
    Lists all unpaid and partially paid invoices with contact numbers for billing.
    """
    sql = text("SELECT * FROM `view_outstanding_balances`")
    rows = db.execute(sql).mappings().all()
    return [OutstandingBalanceReportItem(**dict(row)) for row in rows]


@router.get("/service-summary", response_model=ServiceSummaryReport)
def get_service_summary_report(
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Query database view 'view_service_summary'.
    Provides high-level executive KPIs for the management dashboard.
    """
    sql = text("SELECT * FROM `view_service_summary`")
    row = db.execute(sql).mappings().first()
    if row:
        return ServiceSummaryReport(**dict(row))
    return ServiceSummaryReport(
        total_customers=0,
        total_vehicles=0,
        total_bookings=0,
        pending_bookings=0,
        in_progress_bookings=0,
        completed_bookings=0,
        total_parts_catalog=0,
        low_stock_parts_count=0,
        total_invoiced_amount=0,
        total_revenue_collected=0,
        total_outstanding_balance=0
    )


@router.get("/invoices")
def get_invoice_details_report(
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Query database view 'view_invoice_details'.
    Returns full invoice financials with balance due.
    """
    sql = text("SELECT * FROM `view_invoice_details` ORDER BY invoice_id DESC")
    rows = db.execute(sql).mappings().all()
    return [dict(row) for row in rows]
