from app.schemas.auth import LoginRequest, TokenResponse, UserProfileResponse
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate, UserResponse
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.schemas.mechanic import MechanicCreate, MechanicUpdate, MechanicResponse
from app.schemas.service_type import ServiceTypeCreate, ServiceTypeUpdate, ServiceTypeResponse
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse
from app.schemas.service_details import ServiceDetailsCreate, ServiceDetailsUpdate, ServiceDetailsResponse
from app.schemas.spare_parts import SparePartsCreate, SparePartsUpdate, SparePartsResponse
from app.schemas.parts_used import PartsUsedCreate, PartsUsedUpdate, PartsUsedResponse
from app.schemas.invoice import InvoiceCreate, InvoiceResponse
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.reports import (
    ServiceHistoryReportItem,
    LowStockReportItem,
    OutstandingBalanceReportItem,
    ServiceSummaryReport
)

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "UserProfileResponse",
    "UserCreate",
    "UserUpdate",
    "UserStatusUpdate",
    "UserResponse",
    "CustomerCreate",
    "CustomerUpdate",
    "CustomerResponse",
    "VehicleCreate",
    "VehicleUpdate",
    "VehicleResponse",
    "MechanicCreate",
    "MechanicUpdate",
    "MechanicResponse",
    "ServiceTypeCreate",
    "ServiceTypeUpdate",
    "ServiceTypeResponse",
    "BookingCreate",
    "BookingUpdate",
    "BookingResponse",
    "ServiceDetailsCreate",
    "ServiceDetailsUpdate",
    "ServiceDetailsResponse",
    "SparePartsCreate",
    "SparePartsUpdate",
    "SparePartsResponse",
    "PartsUsedCreate",
    "PartsUsedUpdate",
    "PartsUsedResponse",
    "InvoiceCreate",
    "InvoiceResponse",
    "PaymentCreate",
    "PaymentResponse",
    "ServiceHistoryReportItem",
    "LowStockReportItem",
    "OutstandingBalanceReportItem",
    "ServiceSummaryReport"
]
