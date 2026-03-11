from pydantic import BaseModel, Field, ConfigDict, field_validator
from peewee import (
    Model,
    AutoField,
    CharField,
    IntegerField,
)
from enum import IntEnum
from typing import Optional
import logging

# Import hash_password only when needed to avoid circular imports
# We'll use a lazy import in the validator


LOGGER = logging.getLogger(__name__)


email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
argon2_pattern = r"^\$argon2id\$v=[0-9]+\$m=[0-9]+,t=[0-9]+,p=.*$"


class UserRole(IntEnum):
    SUPER_ADMIN = 0
    ADMIN = 1
    USER = 2


class AdminRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",  # Reject any extra fields
        json_schema_extra={
            "example": {
                "display_name": "admin",
                "email": "admin@example.com",
                "password": "plain text password",
            },
        },
    )
    display_name: Optional[str] = Field(
        min_length=1, max_length=64, title="User display name", default="Root Admin"
    )
    email: str = Field(
        min_length=3,
        max_length=120,
        title="User email",
        pattern=email_pattern,
    )
    password: Optional[str] = Field(
        min_length=1, max_length=1024, title="Password", default="password"
    )
    role: UserRole = UserRole.ADMIN


class UserRequest(BaseModel):
    id: int | None = Field(default=None, title="User ID")
    display_name: Optional[str] = Field(
        min_length=1, max_length=64, title="User display name", default="Unknown User"
    )
    email: str | None = Field(
        min_length=3,
        max_length=120,
        title="User email",
        pattern=email_pattern,
        default=None,
    )
    password: Optional[str] = Field(
        min_length=1, max_length=1024, title="Password", default=None
    )
    role: Optional[UserRole] = Field(title="User role", default=UserRole.USER)


class LoginRequest(BaseModel):
    """Request model for user login"""

    email: str = Field(
        min_length=3,
        max_length=120,
        title="Admin email",
        pattern=email_pattern,
    )
    password: str


class User(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "display_name": "admin",
                "email": "admin@example.com",
                "password": "hashed_password",
                "role": 1,
            },
        }
    )
    id: int | None = Field(default=None, title="User ID")
    display_name: str = Field(min_length=1, max_length=64, title="Display name")
    email: str = Field(
        min_length=3,
        max_length=120,
        title="User email",
        pattern=email_pattern,
    )
    password: Optional[str] = Field(
        min_length=1,
        max_length=1024,
        title="Password",
        default=None,
    )
    role: UserRole = Field(title="User role")

    @field_validator("password", mode="before")
    @classmethod
    def hash_password_if_needed(cls, v: Optional[str]) -> str:
        """
        Automatically hash plain text passwords using Pydantic v2 field validator.

        If the password is already hashed (starts with $argon2id$), it's returned as-is.
        Otherwise, it's hashed using Argon2.

        This allows the User model to accept both:
        - Plain text passwords (from API requests) -> automatically hashed
        - Already hashed passwords (from database) -> used as-is
        """
        if not v or not isinstance(v, str):
            return v

        # Check if password is already hashed (Argon2 hash format)
        # or if it is a placeholder to hide the password hash
        if v.startswith("$argon2id$") or v == "********":
            # Already hashed, return as-is
            return v

        # Plain text password, hash it
        from api.security import hash_password

        return hash_password(v)


class LoginResponse(BaseModel):
    """Response model for successful login"""

    success: bool
    message: str
    user: User | None = None


class UserDB(Model):
    id = AutoField(primary_key=True)
    display_name = CharField(max_length=64, unique=True, index=True)
    email = CharField(max_length=120, unique=True, index=True)
    role = IntegerField(default=UserRole.USER)
    password = CharField(max_length=1024)

    class Meta:
        table_name = "user"

    def __repr__(self):
        return f"""<User (
                    id={self.id},
                    display_name={self.display_name},
                    email={self.email},
                    role={UserRole(self.role).name}
                )>"""

    @classmethod
    def from_pydantic(cls, user: User):
        """Create a UserDB instance from a User"""
        if not user.password:
            return cls(
                id=user.id,
                display_name=user.display_name,
                email=user.email,
                role=user.role,
            )
        return cls(
            id=user.id,
            display_name=user.display_name,
            email=user.email,
            password=user.password,
            role=user.role,
        )

    def to_pydantic(self):
        """Create a User instance from a UserDB"""
        return User(
            id=self.id,
            display_name=self.display_name,
            email=self.email,
            password="********",
            role=self.role,
        )

    def get_role_name(self):
        """Get the role name as string"""
        return UserRole(self.role).name
