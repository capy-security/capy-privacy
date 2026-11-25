from api.api.auth import router as router_auth
from api.api.database import router as router_database
from api.api.metrics import router as router_metrics
from api.api.system import router as router_system
from api.api.setup import router as router_setup
from api.configuration import api_conf
from api.logging import setup_logging
from api.database import get_database_fastapi, close_database
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# from fastapi.staticfiles import StaticFiles
import asyncio
import logging


# setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from api.dnsdist_acl import sync_acl_with_retry

    logger.info("starting API...")
    logger.info(f"origins: {str(api_conf.origins)}")
    get_database_fastapi()
    logger.info("Database connected and tables created")
    # Push allowed_ip → dnsdist ACL in the background (core may still be starting).
    sync_task = asyncio.create_task(sync_acl_with_retry())
    yield
    sync_task.cancel()
    try:
        await sync_task
    except asyncio.CancelledError:
        pass
    logger.info("stopping API...")
    await close_database()


api = FastAPI(
    title="Capy Privacy API",
    description="Capy Privacy DNS server API",
    version="0.1.0",
    lifespan=lifespan,
)


api.include_router(router_auth)
api.include_router(router_database)
api.include_router(router_metrics)
api.include_router(router_system)
api.include_router(router_setup)
api.add_middleware(
    CORSMiddleware,
    allow_origins=api_conf.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# api.mount("/static", StaticFiles(directory="static"), name="static")


@api.get("/health")
async def health():
    """simple health check
    returns the api name
    """
    return {"message": api_conf.api_name}
