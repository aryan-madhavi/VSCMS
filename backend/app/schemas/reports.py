from datetime import date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel

class ServiceHistoryReportItem(BaseModel):
    booking_id: int
    booking_date: date
    booking_status: str
    customer_id: int
    customer_name: str
    customer_phone: str
    vehicle_id: int
    registration_number: str
    vehicle_info: str
    service_detail_id: Optional[int] = None
    service_type: Optional[str] = None
    mechanic_name: Optional[str] = None
    labor_cost: Optional[Decimal] = None
    parts_cost: Optional[Decimal] = None
    total_detail_cost: Optional[Decimal] = None
    detail_status: Optional[str] = None
    service_notes: Optional[str] = None

class LowStockReportItem(BaseModel):
    part_id: int
    part_name: str
    part_number: str
    unit_price: Decimal
    stock_quantity: int
    reorder_level: int
    shortage_quantity: int
    alert_severity: str

class OutstandingBalanceReportItem(BaseModel):
    invoice_id: int
    booking_id: int
    invoice_date: date
    customer_id: int
    customer_name: str
    customer_phone: str
    registration_number: str
    vehicle_model: str
    total_amount: Decimal
    total_paid: Decimal
    balance_due: Decimal
    payment_status: str

class ServiceSummaryReport(BaseModel):
    total_customers: int
    total_vehicles: int
    total_bookings: int
    pending_bookings: int
    in_progress_bookings: int
    completed_bookings: int
    total_parts_catalog: int
    low_stock_parts_count: int
    total_invoiced_amount: Decimal
    total_revenue_collected: Decimal
    total_outstanding_balance: Decimal
