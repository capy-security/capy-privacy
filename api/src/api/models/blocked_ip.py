import ipaddress
import logging

from peewee import AutoField, CharField, Model
from pydantic import BaseModel, ConfigDict, Field, field_validator


LOGGER = logging.getLogger(__name__)


class BlockedIP(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {"ip": "203.0.113.99", "reason": "Unknown scanner"},
            ],
        }
    )
    id: int | None = Field(default=None, title="Blocked IP ID")
    ip: str = Field(min_length=1, max_length=45, title="Blocked IP address")
    reason: str = Field(
        default="", min_length=0, max_length=128, title="Block reason"
    )

    @field_validator("ip")
    @classmethod
    def validate_ip(cls, v: str) -> str:
        v = v.strip()
        addr = ipaddress.ip_address(v)
        return str(addr)

    @field_validator("reason", mode="before")
    @classmethod
    def convert_none_to_empty_string(cls, v):
        if v is None:
            return ""
        return v


class BlockedIPDB(Model):
    id = AutoField(primary_key=True)
    ip = CharField(max_length=45, unique=True)
    reason = CharField(max_length=128, default="")

    class Meta:
        table_name = "blocked_ip"

    def __repr__(self):
        return f"<blocked_ip (id={self.id}, ip={self.ip})>"

    @classmethod
    def from_pydantic(cls, blocked_ip: BlockedIP):
        return cls(
            id=blocked_ip.id,
            ip=blocked_ip.ip,
            reason=blocked_ip.reason,
        )

    def to_pydantic(self):
        return BlockedIP(
            id=self.id,
            ip=self.ip,
            reason=self.reason,
        )
