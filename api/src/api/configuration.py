# -*- encoding: utf-8 -*-
import os


# Grabs the folder where the script runs.
BASEDIR = os.path.abspath(os.path.dirname(__file__))
BD_PATH_DEV = "database/database.db"
BD_PATH_PROD = "/var/capy/database/database.db"


class BaseConfig:
    """
    Configuration base, for all environments.
    """

    api_name: str = "Capy Privacy API"
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class ProductionConfig(BaseConfig):
    api_env = "production"
    api_secret = os.environ.get("API_SECRET", "")
    origins = [
        "*",
        f"admin.{os.environ.get('DOMAIN', 'localhost')}",
        f"api.{os.environ.get('DOMAIN', 'localhost')}",
    ]
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASEDIR, BD_PATH_PROD)}"


class DevelopmentConfig(BaseConfig):
    api_env = "development"
    api_secret = "capybara"
    origins = [
        "http://localhost:5173",
        f"admin.{os.environ.get('DOMAIN', 'localhost')}",
        f"api.{os.environ.get('DOMAIN', 'localhost')}",
    ]
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASEDIR, BD_PATH_DEV)}"


choice = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}


def get_config():
    api_env = os.environ.get("API_ENV")
    config = choice.get(api_env or "production")
    if config is ProductionConfig and not config.api_secret:
        raise ValueError(
            "API_SECRET environment variable is required in production. "
            "Run prerequisites.sh to generate .env with API_SECRET, or set API_SECRET when starting the API."
        )
    return config


global api_conf
api_conf = get_config()
