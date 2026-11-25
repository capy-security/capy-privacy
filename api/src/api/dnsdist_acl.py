"""Drive dnsdist's in-memory ACL over the encrypted console.

SQLite ``allowed_ip`` remains the source of truth; this module pushes
addACL / rmACL / setACL to dnsdist so queries are gated before the recursor.
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any, Iterable

logger = logging.getLogger(__name__)

LOOPBACK_MASKS = ("127.0.0.0/8", "::1/128")


def _console_host() -> str:
    return (os.environ.get("CORE_HOST") or "host.docker.internal").strip()


def _console_port() -> int:
    raw = (os.environ.get("DNSDIST_CONSOLE_PORT") or "5199").strip()
    try:
        return int(raw)
    except ValueError:
        logger.warning(f"Invalid DNSDIST_CONSOLE_PORT={raw!r}, using 5199")
        return 5199


def _console_key() -> str | None:
    key = (os.environ.get("DNSDIST_CONSOLE_KEY") or "").strip()
    return key or None


def _escape_lua_string(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _lua_string_list(masks: Iterable[str]) -> str:
    parts = [f'"{_escape_lua_string(m)}"' for m in masks if m]
    return "{" + ", ".join(parts) + "}"


def _open_console() -> Any:
    # Lazy import: libnacl needs system libsodium (present in the API image).
    from dnsdist_console import Console

    key = _console_key()
    if not key:
        raise RuntimeError("DNSDIST_CONSOLE_KEY is not set")
    return Console(key=key, host=_console_host(), port=_console_port())


def _run_command(cmd: str) -> str:
    console = _open_console()
    try:
        return console.send_command(cmd=cmd)
    finally:
        console.disconnect()


def add_allowed_ip(ip: str) -> None:
    """Add a single host/CIDR to the live dnsdist ACL."""
    mask = ip.strip()
    if not mask:
        return
    cmd = f'addACL("{_escape_lua_string(mask)}")'
    _run_command(cmd)
    logger.info(f"dnsdist ACL addACL({mask})")


def remove_allowed_ip(ip: str) -> None:
    """Remove an exact prior ACL entry (must match the string used in addACL)."""
    mask = ip.strip()
    if not mask:
        return
    cmd = f'rmACL("{_escape_lua_string(mask)}")'
    _run_command(cmd)
    logger.info(f"dnsdist ACL rmACL({mask})")


def set_allowed_ips(ips: Iterable[str]) -> None:
    """Replace the full ACL with loopback + the given allowed_ip rows."""
    masks: list[str] = list(LOOPBACK_MASKS)
    seen = set(masks)
    for ip in ips:
        mask = (ip or "").strip()
        if not mask or mask in seen:
            continue
        masks.append(mask)
        seen.add(mask)
    cmd = f"setACL({_lua_string_list(masks)})"
    _run_command(cmd)
    logger.info(f"dnsdist ACL setACL ({len(masks)} entries)")


def sync_acl_from_database() -> None:
    """Rebuild dnsdist ACL from all AllowedIPDB rows."""
    from api.models.allowed_ip import AllowedIPDB

    ips = [row.ip for row in AllowedIPDB.select(AllowedIPDB.ip)]
    set_allowed_ips(ips)


def try_add_allowed_ip(ip: str) -> bool:
    try:
        add_allowed_ip(ip)
        return True
    except Exception as e:
        logger.error(f"Failed to addACL({ip!r}) on dnsdist: {e}")
        return False


def try_remove_allowed_ip(ip: str) -> bool:
    try:
        remove_allowed_ip(ip)
        return True
    except Exception as e:
        logger.error(f"Failed to rmACL({ip!r}) on dnsdist: {e}")
        return False


def try_sync_acl_from_database() -> bool:
    try:
        sync_acl_from_database()
        return True
    except Exception as e:
        logger.error(f"Failed to sync dnsdist ACL from database: {e}")
        return False


async def sync_acl_with_retry(
    *,
    attempts: int = 10,
    delay_seconds: float = 2.0,
) -> bool:
    """Full setACL sync with backoff (core may start after the API)."""
    for attempt in range(1, attempts + 1):
        if try_sync_acl_from_database():
            return True
        if attempt < attempts:
            logger.info(
                f"dnsdist ACL sync retry {attempt}/{attempts} in {delay_seconds}s"
            )
            await asyncio.sleep(delay_seconds)
    logger.error(f"dnsdist ACL sync failed after {attempts} attempts")
    return False
