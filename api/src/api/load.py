import asyncio
from urllib.request import urlretrieve
from api.models.category import CategoryDB
from api.models.domain import DomainDB
from api.database import get_database, database
from peewee import chunked
from typing import Iterator, Iterable


def domains_generator() -> Iterator[dict]:
    """Generator that yields domain dictionaries from the AdguardDNS blocklist."""
    # Ensure category exists
    ads_category, _ = CategoryDB.get_or_create(
        name="ads",
        defaults={
            "description": "Advertisement domains",
        },
    )

    if ads_category:
        url = "https://v.firebog.net/hosts/AdguardDNS.txt"
        filename = "/tmp/ads.txt"

        # Download file synchronously using urlretrieve
        urlretrieve(url, filename)

        # Read file synchronously (regular file I/O)
        with open(filename, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line != "" and line[0] != "#":
                    yield {
                        "name": line,
                        "category": ads_category.id,
                        "isactive": True,
                        "ip": "127.0.0.1",
                    }


async def insert_domains_chunked(domains: Iterable[dict], batch_size=1000):
    """
    Async bulk insert of domains using chunked batches.

    Args:
        domains: Iterable of domain dictionaries to insert
        batch_size: Number of domains per batch

    Returns:
        tuple: (success: bool, total_inserted: int, total_attempted: int)
    """
    total_inserted = 0
    total_attempted = 0

    try:
        with database.atomic():
            for batch in chunked(domains, batch_size):
                batch_size_actual = len(batch)
                total_attempted += batch_size_actual
                # execute() returns the number of rows inserted
                total_inserted = (
                    DomainDB.insert_many(batch).on_conflict_ignore().execute()
                )
        return True, total_inserted, total_attempted
    except Exception:
        return False, total_inserted, total_attempted


async def load_ads_domains():
    """
    Load ads domains into the database asynchronously.

    Returns:
        tuple: (success: bool, total_inserted: int, total_attempted: int)
    """
    domains = domains_generator()
    success, total_inserted, total_attempted = await insert_domains_chunked(
        domains, batch_size=1000
    )
    return success, total_inserted, total_attempted


if __name__ == "__main__":
    get_database()
    asyncio.run(load_ads_domains())
