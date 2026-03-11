from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from api.database import get_database_fastapi, get_database_path
from api.models.api import ApiResponse
from api.security import check_authorization
from peewee import SqliteDatabase
import logging
import os


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/system",
    tags=["system"],
    responses={404: {"description": "Not found"}},
)


@router.get("/info/")
async def system_info():
    """
    Get system information
    """
    return {"status": "ok", "message": "server is up"}


@router.get("/database/size/")
async def get_database_size(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """
    Get database size using SQLite PRAGMA queries.

    Returns both the logical database size (from PRAGMA) and the physical file size.
    The logical size represents the actual data stored, while file size includes
    overhead, WAL files, and other SQLite structures.

    Args:
        database: Database connection
        authorization: Authorization token

    Returns:
        ApiResponse with database size information in bytes and human-readable format
    """
    response = ApiResponse(success=False, message="", data={})

    try:
        # Get database path
        db_path = get_database_path()

        # Get logical database size using PRAGMA queries
        cursor = database.execute_sql("PRAGMA page_count;")
        page_count = cursor.fetchone()[0]

        cursor = database.execute_sql("PRAGMA page_size;")
        page_size = cursor.fetchone()[0]

        # Calculate logical size (actual data stored)
        logical_size_bytes = page_count * page_size

        # Get physical file size
        file_size_bytes = 0
        wal_size_bytes = 0
        shm_size_bytes = 0

        if os.path.exists(db_path):
            file_size_bytes = os.path.getsize(db_path)

        # Check for WAL file (Write-Ahead Logging)
        wal_path = f"{db_path}-wal"
        if os.path.exists(wal_path):
            wal_size_bytes = os.path.getsize(wal_path)

        # Check for SHM file (Shared Memory)
        shm_path = f"{db_path}-shm"
        if os.path.exists(shm_path):
            shm_size_bytes = os.path.getsize(shm_path)

        total_file_size_bytes = file_size_bytes + wal_size_bytes + shm_size_bytes

        # Helper function to format bytes
        def format_bytes(bytes_value: int) -> dict:
            """Convert bytes to human-readable format"""
            size = float(bytes_value)
            for unit in ["B", "KB", "MB", "GB", "TB"]:
                if size < 1024.0:
                    return {
                        "value": bytes_value,
                        "unit": unit,
                        "formatted": f"{size:.2f} {unit}",
                    }
                size /= 1024.0
            return {
                "value": bytes_value,
                "unit": "PB",
                "formatted": f"{size:.2f} PB",
            }

        response.success = True
        response.message = "Database size retrieved successfully"
        response.data = {
            "logical_size": {
                "bytes": logical_size_bytes,
                **format_bytes(logical_size_bytes),
            },
            "file_size": {"bytes": file_size_bytes, **format_bytes(file_size_bytes)},
            "wal_size": {"bytes": wal_size_bytes, **format_bytes(wal_size_bytes)},
            "shm_size": {"bytes": shm_size_bytes, **format_bytes(shm_size_bytes)},
            "total_file_size": {
                "bytes": total_file_size_bytes,
                **format_bytes(total_file_size_bytes),
            },
            "database_path": db_path,
            "page_count": page_count,
            "page_size": page_size,
        }

        return response

    except Exception as e:
        logger.error(f"Error getting database size: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Error getting database size: {str(e)}"
        )
