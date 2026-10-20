import ipaddress
import logging

from peewee import AutoField, CharField, Model
from pydantic import BaseModel, ConfigDict, Field, field_validator


LOGGER = logging.getLogger(__name__)

# Long enough for IPv6 CIDR (e.g. 2001:db8:85a3::8a2e:370:7334/128).
ALLOWED_NETWORK_MAX_LENGTH = 64


def normalize_allowed_network(value: str) -> str:
    """Accept a host IP or CIDR; store hosts bare and networks in CIDR form."""
    network = ipaddress.ip_network(value.strip(), strict=False)
    if network.prefixlen == network.max_prefixlen:
        return str(network.network_address)
    return str(network)


def parse_allowed_network(value: str) -> ipaddress.IPv4Network | ipaddress.IPv6Network:
    """Parse a stored allowlist entry (host or CIDR)."""
    return ipaddress.ip_network(value.strip(), strict=False)


def find_matching_allow_entry(
    client_ip: str,
    entries: list[tuple[str, str]],
) -> tuple[str, str] | None:
    """
    Return (allowlist entry, reason) if client_ip is covered by any entry.

    Prefer the most specific match (longest prefix) when several networks apply.
    """
    try:
        addr = ipaddress.ip_address(client_ip.strip())
    except ValueError:
        return None

    best: tuple[str, str, int] | None = None
    for entry, reason in entries:
        try:
            network = parse_allowed_network(entry)
        except ValueError:
            LOGGER.warning("Skipping invalid allowlist entry: %s", entry)
            continue
        if addr not in network:
            continue
        if best is None or network.prefixlen > best[2]:
            best = (entry, reason, network.prefixlen)

    if best is None:
        return None
    return best[0], best[1]


class AllowedIP(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"ip": "203.0.113.10", "reason": "Home LTE"},
                {"ip": "37.167.0.0/16", "reason": "Mobile ISP CGNAT"},
            ],
        }
    )
    id: int | None = Field(default=None, title="Allowed IP ID")
    ip: str = Field(
        min_length=1,
        max_length=ALLOWED_NETWORK_MAX_LENGTH,
        title="Allowed IP address or CIDR network",
        description="Single IPv4/IPv6 address or CIDR (e.g. 37.167.0.0/16).",
    )
    reason: str = Field(
        default="", min_length=0, max_length=128, title="Allow reason"
    )

    @field_validator("ip")
    @classmethod
    def validate_ip(cls, v: str) -> str:
        try:
            return normalize_allowed_network(v)
        except ValueError as exc:
            raise ValueError(
                "Must be a valid IPv4/IPv6 address or CIDR network "
                "(e.g. 203.0.113.10 or 37.167.0.0/16)"
            ) from exc

    @field_validator("reason", mode="before")
    @classmethod
    def convert_none_to_empty_string(cls, v):
        if v is None:
            return ""
        return v


class AllowedIPDB(Model):
    id = AutoField(primary_key=True)
    ip = CharField(max_length=ALLOWED_NETWORK_MAX_LENGTH, unique=True)
    reason = CharField(max_length=128, default="")

    class Meta:
        table_name = "allowed_ip"

    def __repr__(self):
        return f"<allowed_ip (id={self.id}, ip={self.ip})>"

    @classmethod
    def from_pydantic(cls, allowed_ip: AllowedIP):
        return cls(
            id=allowed_ip.id,
            ip=allowed_ip.ip,
            reason=allowed_ip.reason,
        )

    def to_pydantic(self):
        return AllowedIP(
            id=self.id,
            ip=self.ip,
            reason=self.reason,
        )
