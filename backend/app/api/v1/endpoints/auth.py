from typing import Annotated

from fastapi import APIRouter, Depends, Header

from app.api.deps import DbSession, CurrentUser
from app.core.exceptions import AuthenticationError
from app.core.security import create_access_token, decode_token
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserMe
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: DbSession) -> Token:
    """Authenticate user and return tokens."""
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(request.username, request.password)

    if not user:
        raise AuthenticationError("Incorrect username or password")

    auth_service.update_last_login(user)
    return auth_service.create_tokens(user)


@router.post("/refresh", response_model=Token)
def refresh_token(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> Token:
    """Refresh access token using refresh token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("Missing refresh token")

    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)

    if not payload or payload.get("type") != "refresh":
        raise AuthenticationError("Invalid refresh token")

    user_id_str = payload.get("sub")
    try:
        user_id = int(user_id_str) if user_id_str else None
    except (ValueError, TypeError):
        raise AuthenticationError("Invalid refresh token")

    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)

    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive")

    return auth_service.create_tokens(user)


@router.get("/me", response_model=UserMe)
def get_current_user_info(current_user: CurrentUser) -> UserMe:
    """Get current user information."""
    return UserMe.model_validate(current_user)
