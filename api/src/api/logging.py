from logging.config import dictConfig
import logging

logging_config_fastapi = {
    "version": 1,
    "disable_existing_loggers": False,  # keeps Uvicorn's loggers working
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(asctime)s [%(name)s] %(message)s",
            "use_colors": True,
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "": {  # root logger
            "handlers": ["default"],
            "level": "INFO",
            "propagate": True,
        },
    },
}


class EndpointFilter(logging.Filter):
    """Filter out healthcheck endpoint logs."""

    def filter(self, record: logging.LogRecord) -> bool:
        return "/health" not in record.getMessage()


def exclude_health_checks_from_logs():
    """Apply endpoint filter to Uvicorn access logger."""
    logging.getLogger("uvicorn.access").addFilter(EndpointFilter())


def setup_logging(logging_config: dict = logging_config_fastapi):
    # Configure logging before any other imports
    dictConfig(logging_config)
    exclude_health_checks_from_logs()
