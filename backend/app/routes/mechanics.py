from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin, require_admin
from app.models.mechanic import Mechanic
from app.schemas.mechanic import MechanicCreate, MechanicUpdate, MechanicResponse

router = APIRouter(prefix="/mechanics", tags=["Mechanics"])


@router.get("", response_model=List[MechanicResponse])
def list_mechanics(
    active_only: bool = Query(False, description="Filter only active mechanics"),
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    List mechanics with optional active status filtering.
    """
    query = db.query(Mechanic)
    if active_only:
        query = query.filter(Mechanic.is_active == True)
    return query.order_by(Mechanic.name.asc()).all()


@router.post("", response_model=MechanicResponse, status_code=status.HTTP_201_CREATED)
def create_mechanic(
    mechanic_in: MechanicCreate,
    db: Session = Depends(get_db),
    user=Depends(require_admin)  # Admin only manages mechanics
):
    """
    Register a new technician profile. Admin only.
    """
    mechanic = Mechanic(
        name=mechanic_in.name.strip(),
        phone=mechanic_in.phone.strip(),
        email=mechanic_in.email,
        specialization=mechanic_in.specialization.strip(),
        is_active=mechanic_in.is_active
    )
    db.add(mechanic)
    db.commit()
    db.refresh(mechanic)
    return mechanic


@router.get("/{mechanic_id}", response_model=MechanicResponse)
def get_mechanic(
    mechanic_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Retrieve single mechanic details.
    """
    mechanic = db.query(Mechanic).filter(Mechanic.mechanic_id == mechanic_id).first()
    if not mechanic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mechanic ID {mechanic_id} not found."
        )
    return mechanic


@router.put("/{mechanic_id}", response_model=MechanicResponse)
def update_mechanic(
    mechanic_id: int,
    mechanic_in: MechanicUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_admin)  # Admin only modifies mechanics
):
    """
    Update mechanic profile and active status. Admin only.
    """
    mechanic = db.query(Mechanic).filter(Mechanic.mechanic_id == mechanic_id).first()
    if not mechanic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mechanic ID {mechanic_id} not found."
        )

    if mechanic_in.name is not None:
        mechanic.name = mechanic_in.name.strip()
    if mechanic_in.phone is not None:
        mechanic.phone = mechanic_in.phone.strip()
    if mechanic_in.email is not None:
        mechanic.email = mechanic_in.email
    if mechanic_in.specialization is not None:
        mechanic.specialization = mechanic_in.specialization.strip()
    if mechanic_in.is_active is not None:
        mechanic.is_active = mechanic_in.is_active

    db.commit()
    db.refresh(mechanic)
    return mechanic


@router.delete("/{mechanic_id}")
def delete_mechanic(
    mechanic_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_admin)
):
    """
    Delete mechanic. Blocked if services have been performed by this mechanic.
    """
    mechanic = db.query(Mechanic).filter(Mechanic.mechanic_id == mechanic_id).first()
    if not mechanic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mechanic ID {mechanic_id} not found."
        )

    if len(mechanic.service_details) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete mechanic '{mechanic.name}' because they have {len(mechanic.service_details)} recorded service task(s). Deactivate instead."
        )

    db.delete(mechanic)
    db.commit()
    return {"message": f"Mechanic '{mechanic.name}' deleted successfully."}
