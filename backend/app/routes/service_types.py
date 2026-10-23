from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin, require_admin
from app.models.service_type import ServiceType
from app.schemas.service_type import ServiceTypeCreate, ServiceTypeUpdate, ServiceTypeResponse

router = APIRouter(prefix="/service-types", tags=["Service Types"])


@router.get("", response_model=List[ServiceTypeResponse])
def list_service_types(
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    List all catalog service types with standard base costs.
    """
    return db.query(ServiceType).order_by(ServiceType.service_type_id.asc()).all()


@router.post("", response_model=ServiceTypeResponse, status_code=status.HTTP_201_CREATED)
def create_service_type(
    type_in: ServiceTypeCreate,
    db: Session = Depends(get_db),
    user=Depends(require_admin)  # Admin only manages catalog
):
    """
    Create a new service type catalog item. Admin only.
    """
    existing = db.query(ServiceType).filter(ServiceType.type_name == type_in.type_name.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Service type '{type_in.type_name}' already exists in the catalog."
        )

    st = ServiceType(
        type_name=type_in.type_name.strip(),
        description=type_in.description,
        base_cost=type_in.base_cost
    )
    db.add(st)
    db.commit()
    db.refresh(st)
    return st


@router.get("/{service_type_id}", response_model=ServiceTypeResponse)
def get_service_type(
    service_type_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Retrieve single service type details.
    """
    st = db.query(ServiceType).filter(ServiceType.service_type_id == service_type_id).first()
    if not st:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service Type ID {service_type_id} not found."
        )
    return st


@router.put("/{service_type_id}", response_model=ServiceTypeResponse)
def update_service_type(
    service_type_id: int,
    type_in: ServiceTypeUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_admin)
):
    """
    Update service catalog type details or base cost. Admin only.
    """
    st = db.query(ServiceType).filter(ServiceType.service_type_id == service_type_id).first()
    if not st:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service Type ID {service_type_id} not found."
        )

    if type_in.type_name and type_in.type_name.strip() != st.type_name:
        existing = db.query(ServiceType).filter(ServiceType.type_name == type_in.type_name.strip()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Service type '{type_in.type_name}' already exists in catalog."
            )
        st.type_name = type_in.type_name.strip()

    if type_in.description is not None:
        st.description = type_in.description
    if type_in.base_cost is not None:
        st.base_cost = type_in.base_cost

    db.commit()
    db.refresh(st)
    return st


@router.delete("/{service_type_id}")
def delete_service_type(
    service_type_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_admin)
):
    """
    Delete service type. Blocked if services reference this type.
    """
    st = db.query(ServiceType).filter(ServiceType.service_type_id == service_type_id).first()
    if not st:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service Type ID {service_type_id} not found."
        )

    if len(st.service_details) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete service type '{st.type_name}' because {len(st.service_details)} service task(s) depend on it."
        )

    db.delete(st)
    db.commit()
    return {"message": f"Service Type '{st.type_name}' deleted successfully."}
