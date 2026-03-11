from api.api.dns import router as router_dns
from api.api.auth import router as router_auth
from api.api.metrics import router as router_metrics
from api.api.system import router as router_system
from api.configuration import api_conf
from api.logging import setup_logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.exceptions import register_exception_handlers

# from fastapi.staticfiles import StaticFiles
import logging


# setup logging
setup_logging()
logger = logging.getLogger(__name__)

origins = [
    "*",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting API...")
    yield
    logger.info("stopping API...")


api = FastAPI(
    title="Capy Privacy API",
    description="Capy Privacy DNS server API",
    version="0.1.0",
    lifespan=lifespan,
)


api.include_router(router_dns)
api.include_router(router_auth)
api.include_router(router_metrics)
api.include_router(router_system)
api.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# api.mount("/static", StaticFiles(directory="static"), name="static")
register_exception_handlers(api)


@api.get("/health")
async def health():
    """simple health check
    returns the api name
    """
    return {"message": api_conf.api_name}
