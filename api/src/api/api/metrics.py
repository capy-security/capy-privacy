from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Annotated
from api.database import get_database_fastapi
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
