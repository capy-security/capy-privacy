from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from api.models.api import ApiResponse
from peewee import (
    OperationalError,
    IntegrityError,
    DoesNotExist,
    DatabaseError,
    DataError,
    InternalError,
    ProgrammingError,
    InterfaceError,
)
import logging

logger = logging.getLogger(__name__)


def create_exception_handler(status_code: int, message: str):
    """Factory function to create exception handlers"""

    async def handler(request: Request, exception: Exception):
        logger.error(f"[{message}] request={request}, error={exception}")
        if getattr(exception, "status_code", None):
            custom_status_code = exception.status_code
        else:
            custom_status_code = status_code

        if getattr(exception, "detail", None):
            detail = exception.detail
        else:
            detail = str(exception)

        response = ApiResponse(
            success=False,
            message=message,
            data={"detail": detail},
        )

        return JSONResponse(
            status_code=custom_status_code, content=response.model_dump()
        )

    return handler


def register_exception_handlers(app: FastAPI):
    """Register all exception handlers with the FastAPI app"""
    handlers = {
        OperationalError: (503, "Database Operational Error"),
        IntegrityError: (400, "Database Integrity Error"),
        AttributeError: (400, "Attribute Error"),
        TypeError: (400, "Type Error"),
        ValueError: (400, "Value Error"),
        HTTPException: (400, "HTTP Exception"),
        DoesNotExist: (404, "Object Not Found"),
        DatabaseError: (500, "Database Error"),
        DataError: (400, "Data Error"),
        InternalError: (500, "Internal Error"),
        ProgrammingError: (500, "Programming Error"),
        InterfaceError: (500, "Interface Error"),
    }

    for exc_type, (status_code, message) in handlers.items():
        app.exception_handler(exc_type)(create_exception_handler(status_code, message))
