from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy import delete as sql_delete
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import Base, engine, get_db
from models import Dataset as DatasetModel
from schemas import (
    DatasetCreate,
    DatasetResponse,
    DatasetStatus,
    DatasetUpdate,
    StatsResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="ML Dataset Explorer API",
    description="""
## Machine Learning Dataset Explorer

A modern REST API for managing and tracking machine learning datasets through their lifecycle.

### Features
- Full **CRUD** operations on datasets
- Dataset **status tracking** (Not Explored → Exploring → Ready for Training → Trained)
- **Search** datasets by name
- **Stats** dashboard endpoint
""",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/docs", include_in_schema=False)
async def scalar_docs():
    return HTMLResponse("""<!doctype html>
<html>
  <head>
    <title>ML Dataset Explorer — API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>body { margin: 0; }</style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.json"
      data-configuration='{
        "theme": "purple",
        "layout": "modern",
        "darkMode": true,
        "defaultHttpClient": {
          "targetKey": "javascript",
          "clientKey": "fetch"
        }
      }'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>""")


# ── Datasets ──────────────────────────────────────────────────────────────────

@app.get(
    "/datasets",
    response_model=list[DatasetResponse],
    summary="List all datasets",
    tags=["Datasets"],
)
async def get_all_datasets(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all datasets. Optionally filter by name with `?search=`."""
    query = select(DatasetModel).order_by(DatasetModel.id.desc())
    if search:
        query = query.where(DatasetModel.name.ilike(f"%{search}%"))
    result = await db.execute(query)
    return result.scalars().all()


@app.get(
    "/datasets/stats",
    response_model=StatsResponse,
    summary="Dataset statistics",
    tags=["Datasets"],
)
async def get_dataset_stats(db: AsyncSession = Depends(get_db)):
    """Returns counts broken down by type and status."""
    total = await db.scalar(select(func.count()).select_from(DatasetModel)) or 0

    type_counts: dict[str, int] = {}
    for dtype in ["Tabular", "Image", "Text", "Audio"]:
        count = await db.scalar(
            select(func.count())
            .select_from(DatasetModel)
            .where(DatasetModel.type == dtype)
        ) or 0
        type_counts[dtype.lower()] = count

    status_counts: dict[str, int] = {}
    for s in DatasetStatus:
        count = await db.scalar(
            select(func.count())
            .select_from(DatasetModel)
            .where(DatasetModel.status == s.value)
        ) or 0
        status_counts[s.value] = count

    return StatsResponse(total=total, by_status=status_counts, **type_counts)


@app.get(
    "/datasets/{dataset_id}",
    response_model=DatasetResponse,
    summary="Get a dataset by ID",
    tags=["Datasets"],
)
async def get_dataset(dataset_id: int, db: AsyncSession = Depends(get_db)):
    dataset = await db.get(DatasetModel, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


@app.post(
    "/datasets",
    response_model=DatasetResponse,
    status_code=201,
    summary="Create a new dataset",
    tags=["Datasets"],
)
async def create_dataset(payload: DatasetCreate, db: AsyncSession = Depends(get_db)):
    dataset = DatasetModel(**payload.model_dump())
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)
    return dataset


@app.put(
    "/datasets/{dataset_id}",
    response_model=DatasetResponse,
    summary="Update a dataset",
    tags=["Datasets"],
)
async def update_dataset(
    dataset_id: int,
    payload: DatasetUpdate,
    db: AsyncSession = Depends(get_db),
):
    dataset = await db.get(DatasetModel, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(dataset, key, value)
    await db.commit()
    await db.refresh(dataset)
    return dataset


@app.delete(
    "/datasets/{dataset_id}",
    status_code=204,
    summary="Delete a dataset",
    tags=["Datasets"],
)
async def delete_dataset(dataset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        sql_delete(DatasetModel).where(DatasetModel.id == dataset_id)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Dataset not found")
