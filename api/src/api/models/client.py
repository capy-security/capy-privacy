from pydantic import BaseModel, Field, ConfigDict, field_validator
from peewee import (
    Model,
    AutoField,
    CharField,
)
import logging


LOGGER = logging.getLogger(__name__)


class Client(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "ip": "192.168.1.120",
                "name": "telephone-gael",
            },
        }
    )
    id: int | None = Field(default=None, title="Client ID")
    ip: str = Field(min_length=7, max_length=45, title="Client IP")
    name: str = Field(min_length=1, max_length=64, title="Client Name")
    description: str = Field(
        default="", min_length=0, max_length=128, title="Client Description"
    )

    @field_validator("description", mode="before")
    @classmethod
    def convert_none_to_empty_string(cls, v):
        """Convert None to empty string for description field"""
        if v is None:
            return ""
        return v


class ClientDB(Model):
    id = AutoField(primary_key=True)
    ip = CharField(max_length=45, unique=True, null=True)
    name = CharField(max_length=64, null=True)
    description = CharField(max_length=128, null=True)

    class Meta:
        table_name = "client"

    def __repr__(self):
        return f"""<client (
                    id={self.id},
                    ip={self.ip},
                    name={self.name},
                )>"""

    @classmethod
    def from_pydantic(cls, client: Client):
        """Create a ClientDB instance from a Client"""
        return cls(
            id=client.id,
            ip=client.ip,
            name=client.name,
            description=client.description,
        )

    def to_pydantic(self):
        """Create a Client instance from a ClientDB"""
        return Client(
            id=self.id,
            ip=self.ip,
            name=self.name,
            description=self.description,
        )
