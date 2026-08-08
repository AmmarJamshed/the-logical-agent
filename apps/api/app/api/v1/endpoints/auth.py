from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_meta, get_current_user
from app.core.security import verify_mfa_code
from app.db.session import get_db
from app.models.user import User
from app.schemas import MessageResponse, TokenResponse, UserLogin, UserOut, UserRegister, UserUpdate
from app.services.core import AuditService, AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegister,
    db: Annotated[AsyncSession, Depends(get_db)],
    client: Annotated[dict, Depends(get_client_meta)],
) -> User:
    if not data.gdpr_consent:
        raise HTTPException(status_code=400, detail="GDPR consent required")
    try:
        user = await AuthService.register(db, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await AuditService.log(
        db,
        actor_id=user.id,
        action="user.register",
        resource_type="user",
        resource_id=str(user.id),
        ip_address=client.get("ip_address"),
        user_agent=client.get("user_agent"),
    )
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db)],
    client: Annotated[dict, Depends(get_client_meta)],
) -> dict:
    try:
        user = await AuthService.authenticate(db, data.email, data.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    if user.mfa_enabled:
        if not data.mfa_code or not user.mfa_secret or not verify_mfa_code(user.mfa_secret, data.mfa_code):
            raise HTTPException(status_code=401, detail="MFA code required or invalid")
    user.last_login_at = datetime.now(timezone.utc)
    await AuditService.log(
        db,
        actor_id=user.id,
        action="user.login",
        resource_type="user",
        resource_id=str(user.id),
        ip_address=client.get("ip_address"),
        user_agent=client.get("user_agent"),
    )
    return AuthService.issue_tokens(user)


@router.get("/me", response_model=UserOut)
async def me(user: Annotated[User, Depends(get_current_user)]) -> User:
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.flush()
    return user


@router.post("/logout", response_model=MessageResponse)
async def logout(user: Annotated[User, Depends(get_current_user)]) -> dict:
    return {"message": f"Logged out {user.username}"}
