from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("", response_model=List[VehicleResponse])
def list_vehicles(
    search: Optional[str] = Query(None, description="Search by registration number, make, or model"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    List vehicles with customer details and search filtering.
    """
    query = db.query(Vehicle)
    if customer_id:
        query = query.filter(Vehicle.customer_id == customer_id)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Vehicle.registration_number.ilike(pattern),
                Vehicle.make.ilike(pattern),
                Vehicle.model.ilike(pattern)
            )
        )

    vehicles = query.order_by(Vehicle.vehicle_id.desc()).all()
    result = []
    for v in vehicles:
        resp = VehicleResponse.model_validate(v)
        if v.customer:
            resp.customer_name = f"{v.customer.first_name} {v.customer.last_name}"
        result.append(resp)
    return result


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Register a vehicle associated with a valid customer.
    """
    customer = db.query(Customer).filter(Customer.customer_id == vehicle_in.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer ID {vehicle_in.customer_id} not found."
        )

    existing = db.query(Vehicle).filter(Vehicle.registration_number == vehicle_in.registration_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with registration number '{vehicle_in.registration_number}' is already registered."
        )

    vehicle = Vehicle(
        customer_id=vehicle_in.customer_id,
        registration_number=vehicle_in.registration_number.upper().strip(),
        make=vehicle_in.make.strip(),
        model=vehicle_in.model.strip(),
        year=vehicle_in.year,
        color=vehicle_in.color
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    resp = VehicleResponse.model_validate(vehicle)
    resp.customer_name = f"{customer.first_name} {customer.last_name}"
    return resp


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Retrieve single vehicle details.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle ID {vehicle_id} not found."
        )
    resp = VehicleResponse.model_validate(vehicle)
    if vehicle.customer:
        resp.customer_name = f"{vehicle.customer.first_name} {vehicle.customer.last_name}"
    return resp


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Update an existing vehicle record.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle ID {vehicle_id} not found."
        )

    if vehicle_in.customer_id is not None and vehicle_in.customer_id != vehicle.customer_id:
        customer = db.query(Customer).filter(Customer.customer_id == vehicle_in.customer_id).first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer ID {vehicle_in.customer_id} not found."
            )
        vehicle.customer_id = vehicle_in.customer_id

    if vehicle_in.registration_number and vehicle_in.registration_number.upper().strip() != vehicle.registration_number:
        reg_upper = vehicle_in.registration_number.upper().strip()
        existing = db.query(Vehicle).filter(Vehicle.registration_number == reg_upper).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration number '{reg_upper}' is already in use by another vehicle."
            )
        vehicle.registration_number = reg_upper

    if vehicle_in.make is not None:
        vehicle.make = vehicle_in.make.strip()
    if vehicle_in.model is not None:
        vehicle.model = vehicle_in.model.strip()
    if vehicle_in.year is not None:
        vehicle.year = vehicle_in.year
    if vehicle_in.color is not None:
        vehicle.color = vehicle_in.color

    db.commit()
    db.refresh(vehicle)
    resp = VehicleResponse.model_validate(vehicle)
    if vehicle.customer:
        resp.customer_name = f"{vehicle.customer.first_name} {vehicle.customer.last_name}"
    return resp


@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Delete a vehicle. Referential integrity prevents deletion if bookings exist.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.vehicle_id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle ID {vehicle_id} not found."
        )

    if len(vehicle.bookings) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete vehicle {vehicle.registration_number} because it has {len(vehicle.bookings)} service booking(s)."
        )

    db.delete(vehicle)
    db.commit()
    return {"message": f"Vehicle {vehicle.registration_number} deleted successfully."}
