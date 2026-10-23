from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.connection import get_db
from app.database.dependencies import require_staff_or_admin
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=List[CustomerResponse])
def list_customers(
    search: Optional[str] = Query(None, description="Search by name, phone, or email"),
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    List all customers with optional search filtering.
    """
    query = db.query(Customer)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Customer.first_name.ilike(search_pattern),
                Customer.last_name.ilike(search_pattern),
                Customer.phone.ilike(search_pattern),
                Customer.email.ilike(search_pattern)
            )
        )
    return query.order_by(Customer.customer_id.desc()).all()


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Register a new customer profile.
    """
    if customer_in.email:
        existing = db.query(Customer).filter(Customer.email == customer_in.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A customer with this email address already exists."
            )

    customer = Customer(
        first_name=customer_in.first_name,
        last_name=customer_in.last_name,
        email=customer_in.email,
        phone=customer_in.phone,
        address=customer_in.address
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Retrieve single customer details.
    """
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer ID {customer_id} not found."
        )
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Update an existing customer profile.
    """
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer ID {customer_id} not found."
        )

    if customer_in.email and customer_in.email != customer.email:
        existing = db.query(Customer).filter(Customer.email == customer_in.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A customer with this email address already exists."
            )
        customer.email = customer_in.email

    if customer_in.first_name is not None:
        customer.first_name = customer_in.first_name
    if customer_in.last_name is not None:
        customer.last_name = customer_in.last_name
    if customer_in.phone is not None:
        customer.phone = customer_in.phone
    if customer_in.address is not None:
        customer.address = customer_in.address

    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_staff_or_admin)
):
    """
    Delete a customer. Referential integrity prevents deletion if vehicles exist.
    """
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer ID {customer_id} not found."
        )

    if len(customer.vehicles) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete Customer ID {customer_id} because {len(customer.vehicles)} vehicle(s) are registered to this customer."
        )

    db.delete(customer)
    db.commit()
    return {"message": f"Customer ID {customer_id} deleted successfully."}
