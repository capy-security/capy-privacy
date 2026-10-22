#!/bin/sh

export API_ENV=development && uv run uvicorn api:api --host 0.0.0.0 --port 80 --reload