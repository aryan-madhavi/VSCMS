import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.connection import engine, get_db
from app.routes import (
    auth_router,
    users_router,
    customers_router,
    vehicles_router,
    mechanics_router,
    service_types_router,
    bookings_router,
    service_details_router,
    spare_parts_router,
    parts_used_router,
    invoices_router,
    payments_router,
    reports_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("vscms.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Polls the database on startup with retries to ensure MySQL is fully initialized.
    """
    logger.info("Starting up VSCMS FastAPI backend...")
    connected = False
    retries = 30
    delay = 2

    for i in range(retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully established connection to MySQL database.")
            connected = True
            break
        except Exception as e:
            logger.warning(f"Database not ready yet (attempt {i+1}/{retries}). Waiting {delay}s... Error: {e}")
            time.sleep(delay)

    if not connected:
        logger.error("Failed to connect to MySQL database after multiple attempts. Exiting...")
    else:
        logger.info("VSCMS Backend is ready to accept requests.")

    yield
    logger.info("Shutting down VSCMS Backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Centralized REST API for Vehicle Service Center Management System (VSCMS)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://localhost"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health & Diagnostics"])
def health_check():
    """
    Health check endpoint for Docker/Podman container probes.
    """
    db_status = "unknown"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


# Register all modular domain routers under the /api prefix
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(users_router, prefix=settings.API_V1_PREFIX)
app.include_router(customers_router, prefix=settings.API_V1_PREFIX)
app.include_router(vehicles_router, prefix=settings.API_V1_PREFIX)
app.include_router(mechanics_router, prefix=settings.API_V1_PREFIX)
app.include_router(service_types_router, prefix=settings.API_V1_PREFIX)
app.include_router(bookings_router, prefix=settings.API_V1_PREFIX)
app.include_router(service_details_router, prefix=settings.API_V1_PREFIX)
app.include_router(spare_parts_router, prefix=settings.API_V1_PREFIX)
app.include_router(parts_used_router, prefix=settings.API_V1_PREFIX)
app.include_router(invoices_router, prefix=settings.API_V1_PREFIX)
app.include_router(payments_router, prefix=settings.API_V1_PREFIX)
app.include_router(reports_router, prefix=settings.API_V1_PREFIX)
