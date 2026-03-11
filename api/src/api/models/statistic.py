from pydantic import BaseModel, Field, ConfigDict
from api.models.domain import DomainDB
from peewee import (
    Model,
    AutoField,
    CharField,
    IntegerField,
    ForeignKeyField,
)
import logging


LOGGER = logging.getLogger(__name__)


class Statistic(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "domain_id": 1,
                "client_ip": "192.168.1.100",
                "request_count": 0,
            },
        }
    )
    id: int | None = Field(default=None, title="Statistic ID")
    domain_id: int = Field(title="Domain ID")
    client_ip: str = Field(min_length=7, max_length=45, title="Client IP")
    request_count: int = Field(title="Request count", default=0)


class StatisticDB(Model):
    id = AutoField(primary_key=True)
    domain = ForeignKeyField(DomainDB, index=True)
    client_ip = CharField(max_length=45, index=True)
    request_count = IntegerField(default=0)

    class Meta:
        table_name = "statistic"
        indexes = ((("domain", "client_ip"), True),)  # Unique together constraint

    def __repr__(self):
        return f"""<Statistic (
                    id={self.id},
                    domain_id={self.domain_id},
                    client_ip={self.client_ip},
                    request_count={self.request_count}
                )>"""

    @classmethod
    def from_pydantic(cls, statistic: Statistic):
        """Create a StatisticDB instance from a Statistic"""
        return cls(
            id=statistic.id,
            domain=statistic.domain_id,
            client_ip=statistic.client_ip,
            request_count=statistic.request_count,
        )

    def to_pydantic(self):
        """Create a Statistic instance from a StatisticDB"""
        return Statistic(
            id=self.id,
            domain_id=self.domain,
            client_ip=self.client_ip,
            request_count=self.request_count,
        )


def main():
    LOGGER.info("...")


if __name__ == "__main__":
    main()
