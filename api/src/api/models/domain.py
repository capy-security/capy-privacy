from enum import IntEnum
from pydantic import BaseModel, Field, ConfigDict
from api.models.category import CategoryDB
from peewee import (
    Model,
    AutoField,
    CharField,
    BooleanField,
    ForeignKeyField,
)
import logging


LOGGER = logging.getLogger(__name__)


class DomainCategory(IntEnum):
    ads = 1
    adult = 2
    violence = 3
    undefined = 99


class Domain(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "www.virus.com",
                "category_id": 1,
                "isactive": "true",
                "ip": "127.0.0.1",
            },
        }
    )
    id: int | None = Field(default=None, title="Domain ID")
    name: str = Field(
        min_length=1,
        max_length=253,
        pattern="^[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z0-9]$",
        title="Domain name",
        description="Must be a valid DNS domain",
    )
    category_id: int = Field(
        title="Category ID", description="Reference to category table"
    )
    isactive: bool = Field(title="Domain is active", default=True)
    ip: str = Field(
        min_length=7,
        max_length=45,
        default="127.0.0.1",
        title="IP where the domain will be redirected",
    )


class DomainDB(Model):
    id = AutoField(primary_key=True)
    name = CharField(max_length=253, unique=True, index=True)
    category = ForeignKeyField(CategoryDB, index=True)
    isactive = BooleanField(default=True)
    ip = CharField(default="127.0.0.1")

    class Meta:
        table_name = "domain"

    def __repr__(self):
        return f"""<Domain (
                    id={self.id},
                    name={self.name},
                    category_id={self.category},
                    isactive={str(self.isactive)},
                    ip={self.ip}
                )>"""

    @classmethod
    def from_pydantic(cls, domain: Domain):
        """Create a DomainDB instance from a Domain"""
        return cls(
            id=domain.id,
            name=domain.name,
            category=domain.category_id,
            isactive=domain.isactive,
            ip=domain.ip,
        )

    def to_pydantic(self):
        """Create a Domain instance from a DomainDB"""
        return Domain(
            id=self.id,
            name=self.name,
            category_id=self.category.id,
            isactive=self.isactive,
            ip=self.ip,
        )
