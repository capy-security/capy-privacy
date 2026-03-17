from api.database import get_database_fastapi, get_database_path
from api.models.api import ApiResponse
from api.security import check_authorization
from fastapi import APIRouter, Depends, HTTPException
from peewee import SqliteDatabase
from typing import Annotated
import asyncio
import ipaddress
import logging
import os
import platform
import psutil
import shutil
import socket


logger = logging.getLogger(__name__)

# Minimal DNS query (A record for example.com) for UDP probe
_DNS_QUERY_EXAMPLE_COM = (
    b"\x00\x01\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00"
    b"\x07example\x03com\x00\x00\x01\x00\x01"
)
CORE_PROBE_TIMEOUT = 2.0


router = APIRouter(
    prefix="/system",
    tags=["system"],
    responses={404: {"description": "Not found"}},
)


async def _probe_tcp(host: str, port: int) -> bool:
    try:
        await asyncio.wait_for(
            asyncio.open_connection(host, port),
            timeout=CORE_PROBE_TIMEOUT,
        )
        return True
    except (OSError, asyncio.TimeoutError):
        return False


def _probe_udp_53(host: str) -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.settimeout(CORE_PROBE_TIMEOUT)
            sock.sendto(_DNS_QUERY_EXAMPLE_COM, (host, 53))
            sock.recvfrom(512)
        return True
    except (OSError, socket.timeout):
        return False


@router.get("/health/", response_model=ApiResponse)
async def system_health() -> ApiResponse:
    """
    Probe capy_core DNS services (53/udp, 853/tcp, 5300/tcp) and return status.
    Uses CORE_HOST env (default: capy_core) as target host.
    """
    host = os.environ.get("CORE_HOST", "capy_core")
    loop = asyncio.get_event_loop()
    udp53_ok = await loop.run_in_executor(None, _probe_udp_53, host)
    tcp853_ok = await _probe_tcp(host, 853)
    tcp5300_ok = await _probe_tcp(host, 5300)
    all_ok = udp53_ok and tcp853_ok and tcp5300_ok
    return ApiResponse(
        success=True,
        message="Core services OK" if all_ok else "One or more core probes failed",
        data={
            "host": host,
            "53/udp": "up" if udp53_ok else "down",
            "853/tcp": "up" if tcp853_ok else "down",
            "5300/tcp": "up" if tcp5300_ok else "down",
        },
    )


@router.get("/info/", response_model=ApiResponse)
async def system_info() -> ApiResponse:
    """
    Return CPU, memory, architecture and disk usage in human-readable form.
    """

    def fmt(bytes_val: int) -> str:
        for unit in ("B", "KB", "MB", "GB", "TB"):
            if bytes_val < 1024:
                return f"{bytes_val:.1f} {unit}"
            bytes_val /= 1024
        return f"{bytes_val:.1f} PB"

    mem = psutil.virtual_memory()
    disk = shutil.disk_usage("/")

    return ApiResponse(
        success=True,
        message="System information",
        data={
            "cpu": {
                "cores_physical": psutil.cpu_count(logical=False),
                "cores_logical": psutil.cpu_count(logical=True),
                "usage_percent": psutil.cpu_percent(interval=0.5),
            },
            "memory": {
                "total": fmt(mem.total),
                "available": fmt(mem.available),
                "used": fmt(mem.used),
                "usage_percent": mem.percent,
            },
            "disk": {
                "total": fmt(disk.total),
                "free": fmt(disk.free),
                "used": fmt(disk.used),
                "usage_percent": round(disk.used / disk.total * 100, 1),
            },
            "architecture": {
                "machine": platform.machine(),
                "system": platform.system(),
                "release": platform.release(),
                "python": platform.python_version(),
            },
        },
    )


@router.get("/network/", response_model=ApiResponse)
async def system_network() -> ApiResponse:
    """
    Return every network interface with its IP address and CIDR network.
    Skips loopback and link-local addresses.
    """
    interfaces = []
    for name, addrs in psutil.net_if_addrs().items():
        for addr in addrs:
            if addr.family != socket.AF_INET:
                continue
            ip = addr.address
            netmask = addr.netmask
            if not netmask:
                continue
            network = ipaddress.IPv4Network(f"{ip}/{netmask}", strict=False)
            if network.is_loopback or network.is_link_local:
                continue
            interfaces.append(
                {
                    "interface": name,
                    "ip": ip,
                    "netmask": netmask,
                    "cidr": str(network),
                }
            )

    return ApiResponse(
        success=True,
        message=f"{len(interfaces)} interface(s) found",
        data={"interfaces": interfaces},
    )


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
