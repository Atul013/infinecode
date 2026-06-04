from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class DatasetType(str, Enum):
    tabular = "Tabular"
    image = "Image"
    text = "Text"
    audio = "Audio"


class DatasetStatus(str, Enum):
    not_explored = "Not Explored"
    exploring = "Exploring"
    ready_for_training = "Ready for Training"
    trained = "Trained"


class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, examples=["Iris Dataset"])
    description: Optional[str] = Field(None, max_length=1000, examples=["Classic flower classification dataset"])
    type: DatasetType = Field(..., examples=["Tabular"])
    rows: Optional[int] = Field(None, ge=0, examples=[150])
    features: Optional[int] = Field(None, ge=0, examples=[4])


class DatasetUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=1000)
    type: Optional[DatasetType] = None
    rows: Optional[int] = Field(None, ge=0)
    features: Optional[int] = Field(None, ge=0)
    status: Optional[DatasetStatus] = None


class DatasetResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    type: DatasetType
    rows: Optional[int]
    features: Optional[int]
    status: DatasetStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class StatsResponse(BaseModel):
    total: int
    tabular: int
    image: int
    text: int
    audio: int
    by_status: dict[str, int]
