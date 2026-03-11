from pydantic import BaseModel, Field, ConfigDict
from api.models.category import CategoryDB
from api.models.client import ClientDB
from peewee import (
    Model,
    AutoField,
    CharField,
    ForeignKeyField,
    CompositeKey,
)
import logging


LOGGER = logging.getLogger(__name__)


class Group(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "tablettes-enfants",
                "categories_ids": [1, 2],
                "clients_ids": [2, 3],
            },
        }
    )
    id: int | None = Field(default=None, title="Group ID")
    name: str = Field(title="Group name")
    categories_ids: list[int] = Field(title="Categories that will be blocked")
    clients_ids: list[int] = Field(title="Members of the group")


class GroupDB(Model):
    id = AutoField(primary_key=True)
    name = CharField(max_length=64, unique=True, null=True)

    class Meta:
        table_name = "group"

    def __repr__(self):
        return f"""<Group (
                    id={self.id},
                    name={self.name},
                )>"""

    @classmethod
    def from_pydantic(cls, group_post: Group):
        """Create a GroupDB instance from a GroupPost"""
        return cls(
            id=group_post.id,
            name=group_post.name,
        )

    def to_pydantic(self):
        """Create a Group instance from a GroupDB"""
        # Query categories through the association table
        categories_ids = [
            ac.category.id
            for ac in AssociationCategories.select().where(
                AssociationCategories.group == self
            )
        ]

        # Query clients through the association table
        clients_ids = [
            ac.client.id
            for ac in AssociationClients.select().where(
                AssociationClients.group == self
            )
        ]

        return Group(
            id=self.id,
            name=self.name,
            categories_ids=categories_ids,
            clients_ids=clients_ids,
        )


# Association tables for many-to-many relationships
class AssociationCategories(Model):
    group = ForeignKeyField(GroupDB, backref="categories")
    category = ForeignKeyField(CategoryDB, backref="groups")

    class Meta:
        table_name = "association_categories"
        primary_key = CompositeKey("group", "category")


class AssociationClients(Model):
    group = ForeignKeyField(GroupDB, backref="clients")
    client = ForeignKeyField(ClientDB, backref="groups")

    class Meta:
        table_name = "association_clients"
        primary_key = CompositeKey("group", "client")
