# ML Dataset Explorer

A full-stack Machine Learning Dataset Explorer built with React + FastAPI. Track, manage, and explore your ML datasets through their entire lifecycle.

## Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS v3
- Motion (animations)
- TanStack Query v5 (data fetching + caching)
- Axios + Sonner + Lucide React

**Backend**
- FastAPI + Uvicorn (async)
- SQLAlchemy 2.0 (async ORM)
- SQLite + aiosqlite
- Pydantic v2
- Scalar (API docs)

## Features

- **Create** datasets with name, type, description, rows, and features
- **View** all datasets in an animated card grid
- **Detail panel** — click any card to see full info + lifecycle tracker
- **Edit** any dataset field inline via modal
- **Delete** with confirmation dialog
- **Status tracking** — Not Explored → Exploring → Ready for Training → Trained
- **Search** datasets by name (debounced)
- **Stats bar** — live counts by type (Tabular / Image / Text / Audio)
- **Particle field** background animation

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs` (Scalar UI)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/datasets` | List all (supports `?search=`) |
| GET | `/datasets/{id}` | Get single dataset |
| POST | `/datasets` | Create dataset |
| PUT | `/datasets/{id}` | Update dataset |
| DELETE | `/datasets/{id}` | Delete dataset |
| GET | `/datasets/stats` | Counts by type and status |

## Dataset Schema

```json
{
  "id": 1,
  "name": "Iris Dataset",
  "description": "Classic flower classification dataset",
  "type": "Tabular",
  "rows": 150,
  "features": 4,
  "status": "Ready for Training",
  "created_at": "2026-06-03T00:00:00"
}
```

## Running Tests

```bash
cd backend
pytest test_api.py -v
```

66 tests covering CRUD, validation, concurrency, edge cases, and full lifecycle.
