from pydantic import BaseModel, ConfigDict
from typing import Any


class ApiResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool
    message: str
    data: Any  # Can be dict, list, BaseModel, or list[BaseModel] - FastAPI handles serialization
