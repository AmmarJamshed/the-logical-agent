from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import UserRole
from app.core.rbac import has_permission
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            return None
        user_id = UUID(payload["sub"])
    except (ValueError, KeyError):
        return None
    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    return result.scalar_one_or_none()


async def get_current_user(
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


def require_permission(permission: str) -> Callable:
    async def _checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        if not has_permission(user.role, permission):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _checker


def require_roles(*roles: UserRole) -> Callable:
    async def _checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles and user.role != UserRole.SUPERADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Role not allowed")
        return user

    return _checker


async def get_client_meta(request: Request) -> dict[str, str | None]:
    return {
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
    }
