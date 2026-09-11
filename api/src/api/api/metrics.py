from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Annotated
from api.database import get_database_fastapi
from api.models.blocked_ip import BlockedIPDB
from api.models.client import ClientDB
from api.models.metric import MetricDB
from api.models.api import ApiResponse
from api.security import check_authorization
from peewee import SqliteDatabase, fn
from datetime import datetime
import logging


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/metrics",
    tags=["metrics"],
    responses={404: {"description": "Not found"}},
)


@router.delete("/clean/")
async def clean_metrics(
    before_date: Annotated[
        datetime,
        Query(
            title="Before date",
            description="Delete all metrics with timestamp before this date",
        ),
    ],
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """
    Delete all metrics with timestamp before the specified date.

    Args:
        before_date: Delete all metrics with timestamp before this date
        database: Database connection
        authorization: Authorization token

    Returns:
        ApiResponse with the number of deleted records
    """
    response = ApiResponse(success=False, message="", data={})

    try:
        # Count records before deletion for reporting
        count_before = MetricDB.select().where(MetricDB.timestamp < before_date).count()

        if count_before == 0:
            response.success = True
            response.message = "No metrics found to delete"
            response.data = {"deleted_count": 0, "before_date": before_date.isoformat()}
            return response

        # Delete all metrics with timestamp before the specified date
        deleted_count = (
            MetricDB.delete().where(MetricDB.timestamp < before_date).execute()
        )

        logger.info(f"Deleted {deleted_count} metrics before {before_date.isoformat()}")

        response.success = True
        response.message = f"Successfully deleted {deleted_count} metric(s)"
        response.data = {
            "deleted_count": deleted_count,
            "before_date": before_date.isoformat(),
        }

        return response

    except Exception as e:
        logger.error(f"Error cleaning metrics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error cleaning metrics: {str(e)}")


@router.get("/domains_statistics/")
async def domains_statistics(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    top_n: Annotated[
        int,
        Query(
            title="Top N",
            description="Number of top domains to return",
            ge=1,
            le=1000,
        ),
    ] = 10,
) -> ApiResponse:
    """
    Get statistics about the most requested domains.

    Groups metrics by domain, counts the number of requests for each domain,
    and returns the top N domains ordered by request count (descending).

    Args:
        top_n: Number of top domains to return (default: 10, max: 1000)
        database: Database connection
        authorization: Authorization token

    Returns:
        ApiResponse with a list of domains and their request counts
    """
    response = ApiResponse(success=False, message="", data={})

    try:
        # Group by domain and count requests, order by count descending
        query = (
            MetricDB.select(
                MetricDB.domain,
                fn.COUNT(MetricDB.id).alias("request_count"),
            )
            .group_by(MetricDB.domain)
            .order_by(fn.COUNT(MetricDB.id).desc())
            .limit(top_n)
        )

        # Execute query and build response
        results = []
        for row in query:
            results.append(
                {
                    "domain": row.domain,
                    "request_count": row.request_count,
                }
            )

        logger.info(f"Retrieved statistics for top {len(results)} domains")

        response.success = True
        response.message = f"Retrieved statistics for top {len(results)} domains"
        response.data = {
            "domains": results,
            "total_returned": len(results),
        }

        return response

    except Exception as e:
        logger.error(f"Error retrieving domain statistics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Error retrieving domain statistics: {str(e)}"
        )


@router.get("/client_ips/")
async def client_ips(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    page_number: Annotated[int, Query(ge=1)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=1000)] = 50,
) -> ApiResponse:
    """
    List distinct client IPs seen in DNS metrics.

    Aggregates query counts and first/last seen timestamps, and marks each IP
    as registered (client table) or blocked (blocked_ip table).
    """
    response = ApiResponse(success=False, message="", data={})

    try:
        blocked_ips = {row.ip for row in BlockedIPDB.select(BlockedIPDB.ip)}
        clients_by_ip = {row.ip: row for row in ClientDB.select()}

        base_query = (
            MetricDB.select(
                MetricDB.client_ip,
                fn.COUNT(MetricDB.id).alias("query_count"),
                fn.MAX(MetricDB.timestamp).alias("last_seen"),
                fn.MIN(MetricDB.timestamp).alias("first_seen"),
            )
            .group_by(MetricDB.client_ip)
        )

        total = base_query.count()
        rows = (
            base_query.order_by(fn.MAX(MetricDB.timestamp).desc())
            .paginate(page_number, items_per_page)
        )

        results = []
        for row in rows:
            client = clients_by_ip.get(row.client_ip)
            results.append(
                {
                    "client_ip": row.client_ip,
                    "query_count": row.query_count,
                    "last_seen": row.last_seen.isoformat() if row.last_seen else None,
                    "first_seen": row.first_seen.isoformat() if row.first_seen else None,
                    "registered": client is not None,
                    "client_id": client.id if client else None,
                    "client_name": client.name if client else None,
                    "blocked": row.client_ip in blocked_ips,
                }
            )

        # Include blocked IPs that have no metrics yet
        seen_ips = {item["client_ip"] for item in results}
        for blocked_ip in blocked_ips:
            if blocked_ip in seen_ips:
                continue
            client = clients_by_ip.get(blocked_ip)
            blocked_row = BlockedIPDB.get_or_none(BlockedIPDB.ip == blocked_ip)
            results.append(
                {
                    "client_ip": blocked_ip,
                    "query_count": 0,
                    "last_seen": None,
                    "first_seen": None,
                    "registered": client is not None,
                    "client_id": client.id if client else None,
                    "client_name": client.name if client else None,
                    "blocked": True,
                    "block_reason": blocked_row.reason if blocked_row else "",
                }
            )

        response.success = True
        response.message = f"Retrieved {len(results)} client IP(s)"
        response.data = {
            "clients": results,
            "total_items": total + len(blocked_ips - seen_ips),
            "page_number": page_number,
            "items_per_page": items_per_page,
        }
        return response

    except Exception as e:
        logger.error(f"Error retrieving client IPs: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Error retrieving client IPs: {str(e)}"
        )
