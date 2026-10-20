from api.models.allowed_ip import AllowedIPDB
from api.models.category import CategoryDB
from api.models.client import ClientDB
from api.models.domain import DomainDB
from api.models.group import (
    GroupDB,
    AssociationClients,
    AssociationCategories,
)
from api.models.metric import MetricDB
from api.models.statistic import StatisticDB
from api.models.user import UserDB
from api.configuration import api_conf, BD_PATH_DEV, BD_PATH_PROD
from enum import Enum
from peewee import SqliteDatabase, OperationalError
import logging
import os


logger = logging.getLogger(__name__)


tables = {
    "allowed_ip": AllowedIPDB,
    "category": CategoryDB,
    "client": ClientDB,
    "domain": DomainDB,
    "group": GroupDB,
    "metric": MetricDB,
    "statistic": StatisticDB,
    "user": UserDB,
}


class Tables(str, Enum):
    allowed_ip = "allowed_ip"
    category = "category"
    client = "client"
    domain = "domain"
    group = "group"
    metric = "metric"
    statistic = "statistic"
    user = "user"


def get_database_path():
    """
    Get the database path based on the current environment.
    Returns the absolute path to the database file.
    """
    if api_conf.api_env == "production":
        db_path = BD_PATH_PROD
    else:
        # For development, use relative path from the project root
        db_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), BD_PATH_DEV
        )

    # Ensure the directory exists
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        logger.info(f"Creating database directory: {db_dir}")
        os.makedirs(db_dir, exist_ok=True)

    return db_path


database = SqliteDatabase(get_database_path(), pragmas={"journal_mode": "wal"})


def _bind_models():
    AllowedIPDB._meta.database = database
    CategoryDB._meta.database = database
    DomainDB._meta.database = database
    ClientDB._meta.database = database
    GroupDB._meta.database = database
    MetricDB._meta.database = database
    StatisticDB._meta.database = database
    UserDB._meta.database = database
    AssociationClients._meta.database = database
    AssociationCategories._meta.database = database


def _seed_bootstrap_allowed_ip():
    """If the allowlist is empty, seed IP_ADDRESS so DNS is not locked out after upgrade."""
    ip_address = (os.environ.get("IP_ADDRESS") or "").strip()
    if not ip_address:
        return
    try:
        if AllowedIPDB.select().exists():
            return
        AllowedIPDB.create(ip=ip_address, reason="Bootstrap allowlist entry")
        logger.info(f"Seeded empty allowlist with IP_ADDRESS={ip_address}")
    except Exception as e:
        logger.warning(f"Could not seed bootstrap allowed IP: {e}")


def _ensure_metric_applied_policy_column():
    """Add applied_policy to existing metric tables (create_tables safe=True won't alter)."""
    try:
        cols = [row[1] for row in database.execute_sql("PRAGMA table_info(metric)").fetchall()]
        if "applied_policy" not in cols:
            database.execute_sql(
                "ALTER TABLE metric ADD COLUMN applied_policy VARCHAR(128)"
            )
            logger.info("Added applied_policy column to metric table")
    except Exception as e:
        logger.warning(f"Could not ensure metric.applied_policy column: {e}")


def _ensure_tables():
    _bind_models()
    database.create_tables(
        [
            AllowedIPDB,
            CategoryDB,
            DomainDB,
            ClientDB,
            GroupDB,
            MetricDB,
            StatisticDB,
            UserDB,
            AssociationClients,
            AssociationCategories,
        ],
        safe=True,
    )
    _ensure_metric_applied_policy_column()
    _seed_bootstrap_allowed_ip()


def get_database():
    """
    Provides a connected db; lazy connect if needed.
    """
    if database.is_closed():
        logger.info("Connecting to database")
        try:
            database.connect()
            _ensure_tables()
            return True
        except OperationalError:
            logger.error("Database unavailable")
            return False
    return True


def get_database_fastapi():
    """
    Provides a connected db; lazy connect if needed.
    """
    if database.is_closed():
        database.connect()
        _ensure_tables()
    return database


async def close_database():
    """
    Close the database connection
    """
    if not database.is_closed():
        logger.info("Closing database connection")
        database.close()
    else:
        logger.warning("Database connection already closed")


def populate_database():
    """
    Populate the database with default data for first-time setup.

    Reads DOMAIN and IP_ADDRESS from environment, then:
    - Creates a client with IP_ADDRESS
    - Allows IP_ADDRESS in the DNS allowlist
    - Creates categories: ads, adult, violence, gaming
    - Creates one active domain test.{DOMAIN} (to verify filtering)
    - Creates group "Admin" linked to all categories and the new client
    """
    # domain = os.environ.get("DOMAIN", "localhost")
    ip_address = os.environ.get("IP_ADDRESS", "127.0.0.1")

    if not get_database():
        logger.error("Database not available, cannot populate")
        raise OperationalError("Database not available")

    with database.atomic():
        # Client with IP_ADDRESS
        client, _ = ClientDB.get_or_create(
            ip=ip_address,
            defaults={"name": "Admin client", "description": ""},
        )
        logger.info(f"Client: {client.name} ({client.ip})")

        # Allow server IP so DNS works under default-deny allowlist
        allowed, created = AllowedIPDB.get_or_create(
            ip=ip_address,
            defaults={"reason": "Bootstrap allowlist entry"},
        )
        if created:
            logger.info(f"Allowed IP: {allowed.ip}")
        else:
            logger.info(f"Allowed IP already present: {allowed.ip}")

        # Categories with descriptions
        categories_data = [
            ("ads", "Advertisement domains"),
            ("adult", "Adult content"),
            ("malware", "Malware domains"),
            ("gaming", "Video games domains"),
        ]
        categories = []
        for name, description in categories_data:
            cat, _ = CategoryDB.get_or_create(
                name=name,
                defaults={"description": description},
            )
            categories.append(cat)
        logger.info(f"Categories: {[c.name for c in categories]}")

        # One active domain test.{DOMAIN} (to check filtering)
        test_domain_name = "test.capysecurity.com"
        DomainDB.get_or_create(
            name=test_domain_name,
            defaults={
                "category": categories[0],
                "isactive": True,
                "ip": "127.0.0.1",
            },
        )
        logger.info(f"Domain: {test_domain_name} (active)")

        # Group "Admin": all categories + the client
        group, _ = GroupDB.get_or_create(
            name="Admin",
            defaults={},
        )
        for cat in categories:
            AssociationCategories.get_or_create(group=group, category=cat)
        AssociationClients.get_or_create(group=group, client=client)
        logger.info(
            f"Group {group.name}: linked to {len(categories)} categories and client {client.ip}"
        )
