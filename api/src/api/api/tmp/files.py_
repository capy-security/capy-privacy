from fastapi import APIRouter, UploadFile, File, HTTPException
from api.models.api import ApiResponse
from pathlib import Path
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/files",
    tags=["files"],
    responses={404: {"description": "Not found"}},
)

# Upload configuration
UPLOAD_DIR = Path("/var/capy/files")
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal and other security issues.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    # Remove any path components (../, ..\, etc.)
    filename = os.path.basename(filename)

    # Remove any null bytes
    filename = filename.replace("\x00", "")

    # Remove leading/trailing dots and spaces
    filename = filename.strip(". ")

    # If filename is empty after sanitization, use a default
    if not filename:
        filename = "uploaded_file"

    return filename


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
) -> ApiResponse:
    """
    Upload a file to the server.

    Args:
        file: The file to upload

    Returns:
        ApiResponse with file information
    """
    response = ApiResponse(success=False, message="", data={})

    try:
        # Ensure upload directory exists
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        # Sanitize filename
        safe_filename = sanitize_filename(file.filename or "uploaded_file")
        file_path = UPLOAD_DIR / safe_filename

        # Check if file already exists (optional: you might want to overwrite or rename)
        if file_path.exists():
            # Add timestamp prefix to avoid overwriting
            from datetime import datetime

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_")
            safe_filename = timestamp + safe_filename
            file_path = UPLOAD_DIR / safe_filename

        # Read file content and check size
        content = await file.read()
        file_size = len(content)

        # Check file size
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f}MB",
            )

        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")

        # Write file to disk
        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"File uploaded successfully: {safe_filename} ({file_size} bytes)")

        response.success = True
        response.message = "File uploaded successfully"
        response.data = {
            "filename": safe_filename,
            "size": file_size,
            "content_type": file.content_type,
            "path": str(file_path),
        }

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
