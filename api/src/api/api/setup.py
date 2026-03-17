from api.database import populate_database
from api.load import load_ads_domains
from fastapi import APIRouter
from fastapi import Path
from typing import Annotated
import logging


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/setup",
    tags=["setup"],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
async def setup():
    """
    Setup the database with the default data
    """
    populate_database()
    return {"status": "ok", "message": "setup is up"}


@router.get("/update/{category}")
async def update_category(
    category: Annotated[str, Path(title="Category name")],
):
    """
    Update blocklist domains for a category.
    """
    match category:
        case "ads":
            success, total_inserted, total_attempted = await load_ads_domains()
            if success:
                return {
                    "status": "ok",
                    "message": f"Loaded {total_inserted} domains (attempted {total_attempted})",
                    "inserted": total_inserted,
                    "attempted": total_attempted,
                }
            return {
                "status": "error",
                "message": "Failed to load ads domains",
                "inserted": total_inserted,
                "attempted": total_attempted,
            }
        case "adult" | "malware" | "gaming":
            return {"status": "not_implemented", "message": "Not implemented yet"}
        case _:
            return {"status": "error", "message": "category not found"}
