from pydantic import BaseModel, Field, ConfigDict, field_validator
from peewee import Model, AutoField, CharField
import logging


LOGGER = logging.getLogger(__name__)


class Category(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "malwares",
                "description": "malicious domains",
            },
        }
    )
    id: int | None = Field(default=None, title="Category ID")
    name: str = Field(min_length=1, max_length=64, title="Category name")
    description: str = Field(
        default="", min_length=0, max_length=128, title="Category description"
    )

    @field_validator("description", mode="before")
    @classmethod
    def convert_none_to_empty_string(cls, v):
        """Convert None to empty string for description field"""
        if v is None:
            return ""
        return v


class CategoryDB(Model):
    id = AutoField(primary_key=True)
    name = CharField(max_length=64, unique=True, null=True)
    description = CharField(max_length=128, null=True)

    class Meta:
        table_name = "category"

    def __repr__(self):
        return f"""<Category (
                    id={self.id},
                    name={self.name},
                )>"""

    @classmethod
    def from_pydantic(cls, category: Category):
        """Create a CategoryDB instance from a Category"""
        return cls(
            id=category.id,
            name=category.name,
            description=category.description,
        )

    def to_pydantic(self):
        """Create a Category instance from a CategoryDB"""
        return Category(
            id=self.id,
            name=self.name,
            description=self.description,
        )
