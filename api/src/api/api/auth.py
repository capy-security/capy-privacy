from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from api.database import get_database_fastapi
from api.models.user import (
    UserDB,
    User,
    UserRequest,
    UserRole,
    LoginRequest,
)
from api.models.api import ApiResponse
from api.security import (
    verify_password,
    create_token,
    check_authorization,
)
from peewee import SqliteDatabase
import logging


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={404: {"description": "Not found"}},
)


@router.post("/token/")
async def get_user_token(
    login_data: LoginRequest,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
) -> ApiResponse:
    """Check user login and password"""
    response = ApiResponse(success=False, message="", data={})

    # check if user table is empty
    if UserDB.select().count() == 0:
        raise HTTPException(
            status_code=400,
            detail="No root admin user found. Please create one first (/login/create-admin)",
        )

    # Verify email
    user: UserDB = UserDB.get_or_none(UserDB.email == login_data.email)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )
    # Verify password
    password = verify_password(login_data.password, user.password)
    if not password:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # Password is correct, return user data (without password)
    user = user.to_pydantic()
    token = create_token(user)

    response.success = True
    response.message = "Login successful"
    response.data = {"token": token}
    return response


@router.post("/admin/")
async def create_admin(
    admin_request: User,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
) -> ApiResponse:
    """Create a new admin user"""
    response = ApiResponse(
        success=True, message="Root Admin user created successfully", data={}
    )

    # check if user table is empty
    if UserDB.select().count() == 0:
        logger.info("Creating Root Admin user")
        if not admin_request.password:
            raise HTTPException(
                status_code=400,
                detail="Password is required to create a root admin user",
            )
        # Create the first user as admin
        new_user = UserDB.from_pydantic(admin_request)
        new_user.role = UserRole.ADMIN
        new_user.save()
    else:
        response.success = False
        response.message = "Root Admin user already exists"
        response.data = {}

    return response


@router.post("/user/")
async def create_user(
    user_request: User,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Create a new user"""
    response = ApiResponse(success=False, message="", data={})

    # check if user table is empty
    if UserDB.select().count() == 0:
        raise HTTPException(
            status_code=400,
            detail="No root admin user found. Please create one first",
        )

    if not user_request.password:
        raise HTTPException(
            status_code=400,
            detail="Password is required to create a user",
        )

    new_user = UserDB.from_pydantic(user_request)
    new_user.save()
    response.success = True
    response.message = "User created successfully"
    response.data = new_user.to_pydantic()
    return response


@router.put("/user/")
async def update_user(
    user_request: User,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Update an existing user"""
    response = ApiResponse(success=False, message="", data={})

    if not user_request.id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required to update a user",
        )

    admin_role = authorization.get("role")
    admin_id = authorization.get("sub")

    if admin_role != UserRole.ADMIN.value and admin_id != user_request.id:
        raise HTTPException(
            status_code=403,
            detail="Not allowed to update this user",
        )
    # Find user by ID
    UserDB.get(UserDB.id == user_request.id)

    edited_user = UserDB.from_pydantic(user_request)
    edited_user.save()
    response.success = True
    response.message = "User updated successfully"
    response.data = edited_user.to_pydantic()

    return response


@router.delete("/user/")
async def delete_user(
    user_request: UserRequest,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Delete an existing user"""
    response = ApiResponse(success=False, message="", data={})

    if not user_request.id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required to delete a user",
        )
    user: UserDB = UserDB.get(UserDB.id == user_request.id)
    user.delete_instance()
    response.success = True
    response.message = "User deleted successfully"
    response.data = user.to_pydantic()

    return response
