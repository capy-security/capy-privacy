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
    api_secret = "CrazyVeganUnicorn0@#!)"
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASEDIR, BD_PATH_PROD)}"
    # mysql+pymysql://db_user:db_pass@localhost/db_name
    # SERVER_NAME = "capysecurity.com"


class DevelopmentConfig(BaseConfig):
    api_env = "development"
    api_secret = "capybara"
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASEDIR, BD_PATH_DEV)}"


choice = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}


def get_config():
    api_env = os.environ.get("API_ENV")
    return choice.get(api_env or "production")


global api_conf
api_conf = get_config()
