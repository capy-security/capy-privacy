# syntax=docker/dockerfile:1
ARG application=api
FROM python:slim-trixie
WORKDIR /capy


COPY . .
RUN pip3 install poetry
RUN poetry build
RUN pip3 install dist/${application}*.tar.gz

# COPY alembic.ini .
# COPY migrations migrations
RUN mkdir -p /var/capy/database/
RUN mkdir -p /var/capy/files/
# COPY api/database/ /var/capy/database/
RUN rm -Rf /capy/*

EXPOSE 8080/tcp

# ENV FLASK_ENV=development
CMD [ "uvicorn", "api:api", "--host", "0.0.0.0", "--port", "8080" ]
