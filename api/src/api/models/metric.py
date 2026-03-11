from pydantic import BaseModel, Field, ConfigDict
from api.models.category import CategoryDB
from peewee import (
    Model,
    AutoField,
    CharField,
    BooleanField,
    DateTimeField,
    ForeignKeyField,
)
import logging
from datetime import datetime


LOGGER = logging.getLogger(__name__)


class Metric(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "timestamp": "2025-12-08T10:30:00",
                "client_ip": "192.168.1.100",
                "domain": "example.com",
                "query_type": "A",
                "protocol": "UDP",
                "blocked": False,
                "category_id": None,
            },
        }
    )
    id: int | None = Field(default=None, title="Metrics ID")
    timestamp: datetime = Field(
        title="Query timestamp",
        description="When the DNS query was made",
    )
    client_ip: str = Field(
        min_length=7,
        max_length=45,
        title="Client IP",
        description="IP address of the client making the query",
    )
    domain: str = Field(
        min_length=1,
        max_length=253,
        title="Domain name",
        description="The queried domain name (without trailing dot)",
    )
    query_type: str | None = Field(
        default=None,
        max_length=10,
        title="Query type",
        description="DNS query type (A, AAAA, MX, etc.)",
    )
    protocol: str | None = Field(
        default=None,
        max_length=10,
        title="Protocol",
        description="Transport protocol (UDP, TCP, DoT, DoH, etc.)",
    )
    blocked: bool = Field(
        default=False,
        title="Blocked",
        description="Whether this query was blocked by the blacklist",
    )
    category_id: int | None = Field(
        default=None,
        title="Category ID",
        description="Reference to category table if domain was blocked",
    )


class MetricDB(Model):
    id = AutoField(primary_key=True)
    timestamp = DateTimeField(index=True)
    client_ip = CharField(max_length=45, index=True)
    domain = CharField(max_length=253, index=True)
    query_type = CharField(max_length=10, null=True)
    protocol = CharField(max_length=10, null=True)
    blocked = BooleanField(default=False, index=True)
    category = ForeignKeyField(CategoryDB, null=True, index=True, backref="metric")

    class Meta:
        table_name = "metric"
        indexes = (
            # Composite index for common query patterns
            (("timestamp", "client_ip"), False),
            (("timestamp", "blocked"), False),
        )

    def __repr__(self):
        return f"""<Metric (
                    id={self.id},
                    timestamp={self.timestamp},
                    client_ip={self.client_ip},
                    domain={self.domain},
                    query_type={self.query_type},
                    protocol={self.protocol},
                    blocked={self.blocked},
                    category_id={self.category.id if self.category else None}
                )>"""

    @classmethod
    def from_pydantic(cls, metric: Metric):
        """Create a MetricDB instance from a Metric"""
        return cls(
            id=metric.id,
            timestamp=metric.timestamp,
            client_ip=metric.client_ip,
            domain=metric.domain,
            query_type=metric.query_type,
            protocol=metric.protocol,
            blocked=metric.blocked,
            category=metric.category_id,
        )

    def to_pydantic(self):
        """Create a Metric instance from a MetricDB"""
        return Metric(
            id=self.id,
            timestamp=self.timestamp,
            client_ip=self.client_ip,
            domain=self.domain,
            query_type=self.query_type,
            protocol=self.protocol,
            blocked=self.blocked,
            category_id=self.category.id if self.category else None,
        )
