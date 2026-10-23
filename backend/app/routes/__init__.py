from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.customers import router as customers_router
from app.routes.vehicles import router as vehicles_router
from app.routes.mechanics import router as mechanics_router
from app.routes.service_types import router as service_types_router
from app.routes.bookings import router as bookings_router
from app.routes.service_details import router as service_details_router
from app.routes.spare_parts import router as spare_parts_router
from app.routes.parts_used import router as parts_used_router
from app.routes.invoices import router as invoices_router
from app.routes.payments import router as payments_router
from app.routes.reports import router as reports_router

__all__ = [
    "auth_router",
    "users_router",
    "customers_router",
    "vehicles_router",
    "mechanics_router",
    "service_types_router",
    "bookings_router",
    "service_details_router",
    "spare_parts_router",
    "parts_used_router",
    "invoices_router",
    "payments_router",
    "reports_router"
]
