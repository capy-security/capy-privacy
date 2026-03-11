from fastapi import APIRouter


router = APIRouter(
    prefix="/health",
    tags=["health"],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
async def health_get():
    """
    health check
    don't log requests to this endpoint
    """
    return {"status": "ok", "message": "server is up"}
