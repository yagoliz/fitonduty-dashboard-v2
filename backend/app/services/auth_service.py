import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.schemas.auth import Token

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate_user(self, username: str, password: str) -> User | None:
        """Authenticate a user by username and password."""
        user = self.db.query(User).filter(User.username == username).first()
        if not user:
            logger.warning(f"Login failed: user '{username}' not found")
            return None

        logger.info(f"Found user '{username}', hash starts with: {user.password_hash[:20]}...")

        if not verify_password(password, user.password_hash):
            logger.warning(f"Login failed: password verification failed for '{username}'")
            return None
        if not user.is_active:
            logger.warning(f"Login failed: user '{username}' is not active")
            return None

        logger.info(f"Login successful for user '{username}'")
        return user

    def create_tokens(self, user: User) -> Token:
        """Create access and refresh tokens for a user."""
        token_data = {"sub": str(user.id), "role": user.role}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        return Token(access_token=access_token, refresh_token=refresh_token)

    def update_last_login(self, user: User) -> None:
        """Update the user's last login timestamp."""
        user.last_login = datetime.utcnow()
        self.db.commit()

    def get_user_by_id(self, user_id: int) -> User | None:
        """Get a user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()