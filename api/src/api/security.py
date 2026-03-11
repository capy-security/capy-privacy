from fastapi import Header, status, Request
from api.configuration import api_conf
from api.models.user import User, UserRole
from fastapi import HTTPException
from typing import Annotated
from argon2 import PasswordHasher
from datetime import datetime, timedelta, timezone
import jwt


# Map function names to required roles
# Functions that require ADMIN role
ADMIN_ONLY_FUNCTIONS = {
    "create_user",
    "update_user",
    "delete_user",
    "update_ads",
    "create_object",
    "read_object",
    "update_object",
    # "delete_object",
}

# Functions that require any authenticated user
AUTHENTICATED_FUNCTIONS = {}

# Functions that require any authenticated user
UNAUTHENTICATED_FUNCTIONS = {}


async def check_authorization(
    request: Request,
    authorization: Annotated[
        str, Header(title="Authentication token", max_length=4096)
    ],
):
    """
    Check authorization based on the calling function and user role.

    Args:
        request: FastAPI Request object
        authorization: Authorization header with Bearer token

    Returns:
        Decoded token payload if authorized

    Raises:
        HTTPException: If authorization fails
    """
    # Get the calling function name from the request scope
    endpoint = request.scope.get("endpoint")
    if endpoint:
        function_name = endpoint.__name__
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Endpoint not found",
        )

    # Check if function is in the UNAUTHENTICATED_FUNCTIONS list
    if function_name in UNAUTHENTICATED_FUNCTIONS:
        return

    # Verify token
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required",
        )

    # Extract token from Bearer <token>
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Expected 'Bearer <token>'",
        )

    try:
        encoded_token = authorization.split(" ")[1]
    except IndexError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Expected 'Bearer <token>'",
        )

    # Verify and decode token
    decoded_token = verify_token(encoded_token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Get user role from token
    user_role = decoded_token.get("role")
    # user_email = decoded_token.get("email")
    # user_id = decoded_token.get("sub")
    if user_role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing role information",
        )

    # Check authorization based on function name
    if function_name:
        # Check if function requires admin role
        if function_name in ADMIN_ONLY_FUNCTIONS:
            if user_role != UserRole.ADMIN.value:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Admin role required to access {function_name}",
                )
        # Check if function requires authentication (any role)
        elif function_name in AUTHENTICATED_FUNCTIONS:
            # Any authenticated user can access
            pass
        # If function is not in the list, allow by default (or you can change this behavior)
        # For security, you might want to require authentication by default

    return decoded_token


def create_token(user: User, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT token for a user.

    Args:
        user: User object containing user information
        expires_delta: Optional expiration time delta. Defaults to 24 hours.

    Returns:
        JWT token string
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=24)

    expire = datetime.now(timezone.utc) + expires_delta

    # Create JWT payload
    payload = {
        "sub": str(user.id),  # Subject (user ID)
        "email": user.email,
        "display_name": user.display_name,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "exp": expire,  # Expiration time
        "iat": datetime.now(timezone.utc),  # Issued at
    }

    # Encode the token using the secret from configuration
    token = jwt.encode(
        payload,
        api_conf.api_secret,
        algorithm="HS256",
        headers={"typ": "JWT", "alg": "HS256"},
    )

    return token


def verify_token(token: str) -> dict | None:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string to verify

    Returns:
        Decoded payload dictionary if valid, None if invalid or expired
    """
    try:
        # jwt.decode automatically checks expiration if exp is in the payload
        payload = jwt.decode(token, api_conf.api_secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        # Token has expired
        return None
    except jwt.InvalidTokenError:
        # Token is invalid (wrong signature, malformed, etc.)
        return None


# Initialize Argon2 password hasher
# Argon2 automatically handles salt generation and embedding
_password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """
    Hash a password using Argon2 with automatic salt generation.

    Argon2 is the winner of the Password Hashing Competition and provides
    better security than bcrypt, especially against GPU-based attacks.

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password string (includes salt and parameters)
    """
    # Argon2 automatically generates salt and embeds it in the hash
    return _password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hashed password.

    Args:
        password: Plain text password to verify
        hashed_password: Hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    try:
        _password_hasher.verify(hashed_password, password)
        return True
    except Exception:
        # Argon2 raises an exception if verification fails
        return False
