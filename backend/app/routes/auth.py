from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.connection import get_db
from app.database.dependencies import get_current_user
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserProfileResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(login_req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate user via username or email and password.
    Returns signed JWT access token and sets an HttpOnly cookie.
    """
    user = db.query(User).filter(
        or_(
            User.username == login_req.username_or_email,
            User.email == login_req.username_or_email
        )
    ).first()

    if not user or not verify_password(login_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is deactivated. Please contact an administrator."
        )

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "user_id": user.user_id}
    )

    # Set HttpOnly cookie for defense-in-depth token security
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False  # Allows HTTP on localhost during academic demo
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        role=user.role
    )


@router.post("/logout")
def logout(response: Response):
    """
    Clear authentication session cookie.
    """
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve profile details of currently authenticated user.
    """
    return current_user
