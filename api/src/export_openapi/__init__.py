"""Export FastAPI OpenAPI schema to ``openapi.json`` for Orval.

Run from the ``api`` project root:

    poetry run export-openapi
"""

from __future__ import annotations

import json
import os
from pathlib import Path


def _project_root() -> Path:
    cwd = Path.cwd().resolve()
    if (cwd / "pyproject.toml").is_file():
        return cwd
    raise FileNotFoundError(
        f"Expected pyproject.toml under cwd ({cwd}). "
        "Run export-openapi from the api/ project root."
    )


def export_openapi(output: Path | None = None) -> Path:
    """Write the app OpenAPI schema to ``openapi.json`` (or ``output``)."""
    # Set before importing api — configuration reads API_ENV at import time.
    os.environ.setdefault("API_ENV", "development")

    from api import api as app

    root = _project_root()
    path = output or (root / "openapi.json")
    path.write_text(json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8")
    return path


def main() -> None:
    path = export_openapi()
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
