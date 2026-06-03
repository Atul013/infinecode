"""
Comprehensive stress test suite for ML Dataset Explorer API.
Covers: CRUD, validation, edge cases, error handling, concurrency, stats accuracy.
"""

import asyncio
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from database import Base, get_db
from main import app

# ── Test DB setup (in-memory SQLite, isolated per session) ────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def reset_db():
    """Wipe and recreate tables before every test — full isolation."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def sample_dataset(client):
    """Creates one Iris dataset and returns its JSON response."""
    resp = await client.post("/datasets", json={
        "name": "Iris Dataset",
        "description": "Classic flower classification",
        "type": "Tabular",
        "rows": 150,
        "features": 4,
    })
    assert resp.status_code == 201
    return resp.json()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def create_dataset(client, **overrides):
    payload = {
        "name": "Test Dataset",
        "description": "A test dataset",
        "type": "Tabular",
        "rows": 100,
        "features": 5,
        **overrides,
    }
    return await client.post("/datasets", json=payload)


# =============================================================================
# 1. CREATE — happy path
# =============================================================================

class TestCreate:
    async def test_create_all_types(self, client):
        for dtype in ["Tabular", "Image", "Text", "Audio"]:
            resp = await create_dataset(client, name=f"{dtype} DS", type=dtype)
            assert resp.status_code == 201
            assert resp.json()["type"] == dtype

    async def test_create_returns_correct_fields(self, client, sample_dataset):
        assert sample_dataset["name"] == "Iris Dataset"
        assert sample_dataset["description"] == "Classic flower classification"
        assert sample_dataset["type"] == "Tabular"
        assert sample_dataset["rows"] == 150
        assert sample_dataset["features"] == 4
        assert sample_dataset["status"] == "Not Explored"
        assert "id" in sample_dataset
        assert "created_at" in sample_dataset

    async def test_create_default_status_is_not_explored(self, client):
        resp = await create_dataset(client)
        assert resp.json()["status"] == "Not Explored"

    async def test_create_with_null_optional_fields(self, client):
        resp = await client.post("/datasets", json={"name": "Minimal DS", "type": "Image"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["rows"] is None
        assert data["features"] is None
        assert data["description"] is None

    async def test_create_increments_id(self, client):
        r1 = await create_dataset(client, name="DS1")
        r2 = await create_dataset(client, name="DS2")
        assert r2.json()["id"] == r1.json()["id"] + 1

    async def test_create_zero_rows_and_features(self, client):
        resp = await create_dataset(client, rows=0, features=0)
        assert resp.status_code == 201
        assert resp.json()["rows"] == 0
        assert resp.json()["features"] == 0

    async def test_create_very_large_rows(self, client):
        resp = await create_dataset(client, rows=10_000_000, features=50_000)
        assert resp.status_code == 201
        assert resp.json()["rows"] == 10_000_000

    async def test_create_unicode_name(self, client):
        resp = await create_dataset(client, name="データセット 🌸 données")
        assert resp.status_code == 201
        assert resp.json()["name"] == "データセット 🌸 données"

    async def test_create_special_chars_description(self, client):
        desc = "It's a <test> & \"quoted\" dataset with 100% accuracy\nnewlines too"
        resp = await create_dataset(client, description=desc)
        assert resp.status_code == 201
        assert resp.json()["description"] == desc

    async def test_create_max_length_name(self, client):
        resp = await create_dataset(client, name="A" * 255)
        assert resp.status_code == 201

    async def test_create_max_length_description(self, client):
        resp = await create_dataset(client, description="B" * 1000)
        assert resp.status_code == 201


# =============================================================================
# 2. CREATE — validation failures
# =============================================================================

class TestCreateValidation:
    async def test_missing_name(self, client):
        resp = await client.post("/datasets", json={"type": "Tabular"})
        assert resp.status_code == 422

    async def test_missing_type(self, client):
        resp = await client.post("/datasets", json={"name": "DS"})
        assert resp.status_code == 422

    async def test_empty_name(self, client):
        resp = await create_dataset(client, name="")
        assert resp.status_code == 422

    async def test_invalid_type(self, client):
        resp = await create_dataset(client, type="Video")
        assert resp.status_code == 422

    async def test_negative_rows(self, client):
        resp = await create_dataset(client, rows=-1)
        assert resp.status_code == 422

    async def test_negative_features(self, client):
        resp = await create_dataset(client, features=-100)
        assert resp.status_code == 422

    async def test_name_too_long(self, client):
        resp = await create_dataset(client, name="X" * 256)
        assert resp.status_code == 422

    async def test_description_too_long(self, client):
        resp = await create_dataset(client, description="X" * 1001)
        assert resp.status_code == 422

    async def test_rows_as_string(self, client):
        resp = await create_dataset(client, rows="not-a-number")
        assert resp.status_code == 422

    async def test_empty_body(self, client):
        resp = await client.post("/datasets", json={})
        assert resp.status_code == 422

    async def test_completely_wrong_body(self, client):
        resp = await client.post("/datasets", content="this is not json", headers={"Content-Type": "application/json"})
        assert resp.status_code == 422

    async def test_type_case_sensitive(self, client):
        resp = await create_dataset(client, type="tabular")
        assert resp.status_code == 422


# =============================================================================
# 3. READ — list all
# =============================================================================

class TestGetAll:
    async def test_empty_list(self, client):
        resp = await client.get("/datasets")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_returns_all(self, client):
        for i in range(5):
            await create_dataset(client, name=f"DS {i}")
        resp = await client.get("/datasets")
        assert resp.status_code == 200
        assert len(resp.json()) == 5

    async def test_list_ordered_newest_first(self, client):
        await create_dataset(client, name="First")
        await create_dataset(client, name="Second")
        await create_dataset(client, name="Third")
        resp = await client.get("/datasets")
        names = [d["name"] for d in resp.json()]
        assert names[0] == "Third"
        assert names[-1] == "First"

    async def test_search_exact_match(self, client, sample_dataset):
        resp = await client.get("/datasets?search=Iris")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_search_case_insensitive(self, client, sample_dataset):
        for query in ["iris", "IRIS", "iRiS", "iris dataset"]:
            resp = await client.get(f"/datasets?search={query}")
            assert len(resp.json()) == 1, f"Failed for query: {query}"

    async def test_search_partial_match(self, client):
        await create_dataset(client, name="MNIST Handwriting")
        await create_dataset(client, name="CIFAR-10 Images")
        resp = await client.get("/datasets?search=MNIST")
        assert len(resp.json()) == 1

    async def test_search_no_results(self, client, sample_dataset):
        resp = await client.get("/datasets?search=nonexistent_xyz_123")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_search_empty_string_returns_all(self, client):
        for i in range(3):
            await create_dataset(client, name=f"DS {i}")
        resp = await client.get("/datasets?search=")
        assert len(resp.json()) == 3

    async def test_search_special_chars(self, client):
        await create_dataset(client, name="CIFAR-10")
        resp = await client.get("/datasets?search=CIFAR-10")
        assert len(resp.json()) == 1


# =============================================================================
# 4. READ — by ID
# =============================================================================

class TestGetById:
    async def test_get_existing(self, client, sample_dataset):
        resp = await client.get(f"/datasets/{sample_dataset['id']}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Iris Dataset"

    async def test_get_nonexistent(self, client):
        resp = await client.get("/datasets/99999")
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    async def test_get_after_delete(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        await client.delete(f"/datasets/{ds_id}")
        resp = await client.get(f"/datasets/{ds_id}")
        assert resp.status_code == 404

    async def test_get_id_zero(self, client):
        resp = await client.get("/datasets/0")
        assert resp.status_code == 404

    async def test_get_negative_id(self, client):
        resp = await client.get("/datasets/-1")
        assert resp.status_code in (404, 422)

    async def test_get_string_id(self, client):
        resp = await client.get("/datasets/abc")
        assert resp.status_code == 422


# =============================================================================
# 5. UPDATE
# =============================================================================

class TestUpdate:
    async def test_update_description(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        resp = await client.put(f"/datasets/{ds_id}", json={"description": "Updated desc"})
        assert resp.status_code == 200
        assert resp.json()["description"] == "Updated desc"

    async def test_update_status_all_valid_values(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        for status in ["Not Explored", "Exploring", "Ready for Training", "Trained"]:
            resp = await client.put(f"/datasets/{ds_id}", json={"status": status})
            assert resp.status_code == 200, f"Failed for status: {status}"
            assert resp.json()["status"] == status

    async def test_update_type(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        resp = await client.put(f"/datasets/{ds_id}", json={"type": "Image"})
        assert resp.status_code == 200
        assert resp.json()["type"] == "Image"

    async def test_update_rows_and_features(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        resp = await client.put(f"/datasets/{ds_id}", json={"rows": 999, "features": 42})
        assert resp.status_code == 200
        data = resp.json()
        assert data["rows"] == 999
        assert data["features"] == 42

    async def test_update_preserves_unchanged_fields(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        resp = await client.put(f"/datasets/{ds_id}", json={"status": "Exploring"})
        data = resp.json()
        assert data["name"] == "Iris Dataset"
        assert data["rows"] == 150
        assert data["features"] == 4

    async def test_update_nonexistent(self, client):
        resp = await client.put("/datasets/99999", json={"status": "Exploring"})
        assert resp.status_code == 404

    async def test_update_invalid_status(self, client, sample_dataset):
        resp = await client.put(f"/datasets/{sample_dataset['id']}", json={"status": "In Progress"})
        assert resp.status_code == 422

    async def test_update_invalid_type(self, client, sample_dataset):
        resp = await client.put(f"/datasets/{sample_dataset['id']}", json={"type": "Video"})
        assert resp.status_code == 422

    async def test_update_negative_rows(self, client, sample_dataset):
        resp = await client.put(f"/datasets/{sample_dataset['id']}", json={"rows": -5})
        assert resp.status_code == 422

    async def test_update_empty_body_is_noop(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        resp = await client.put(f"/datasets/{ds_id}", json={})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Iris Dataset"

    async def test_name_cannot_be_updated(self, client, sample_dataset):
        """name is intentionally excluded from DatasetUpdate."""
        ds_id = sample_dataset["id"]
        resp = await client.put(f"/datasets/{ds_id}", json={"name": "New Name"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "Iris Dataset"


# =============================================================================
# 6. DELETE
# =============================================================================

class TestDelete:
    async def test_delete_existing(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        resp = await client.delete(f"/datasets/{ds_id}")
        assert resp.status_code == 204

    async def test_delete_removes_from_list(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        await client.delete(f"/datasets/{ds_id}")
        resp = await client.get("/datasets")
        assert all(d["id"] != ds_id for d in resp.json())

    async def test_delete_nonexistent(self, client):
        resp = await client.delete("/datasets/99999")
        assert resp.status_code == 404

    async def test_delete_twice(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        await client.delete(f"/datasets/{ds_id}")
        resp = await client.delete(f"/datasets/{ds_id}")
        assert resp.status_code == 404

    async def test_delete_only_removes_target(self, client):
        r1 = await create_dataset(client, name="Keep Me")
        r2 = await create_dataset(client, name="Delete Me")
        await client.delete(f"/datasets/{r2.json()['id']}")
        resp = await client.get("/datasets")
        names = [d["name"] for d in resp.json()]
        assert "Keep Me" in names
        assert "Delete Me" not in names


# =============================================================================
# 7. STATS
# =============================================================================

class TestStats:
    async def test_empty_stats(self, client):
        resp = await client.get("/datasets/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["tabular"] == 0
        assert data["image"] == 0
        assert data["text"] == 0
        assert data["audio"] == 0

    async def test_stats_counts_by_type(self, client):
        await create_dataset(client, type="Tabular")
        await create_dataset(client, type="Tabular")
        await create_dataset(client, type="Image")
        await create_dataset(client, type="Text")
        resp = await client.get("/datasets/stats")
        data = resp.json()
        assert data["total"] == 4
        assert data["tabular"] == 2
        assert data["image"] == 1
        assert data["text"] == 1
        assert data["audio"] == 0

    async def test_stats_by_status(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        resp = await client.get("/datasets/stats")
        by_status = resp.json()["by_status"]
        assert by_status["Not Explored"] == 1
        assert by_status["Exploring"] == 0

        await client.put(f"/datasets/{ds_id}", json={"status": "Exploring"})
        resp2 = await client.get("/datasets/stats")
        by_status2 = resp2.json()["by_status"]
        assert by_status2["Not Explored"] == 0
        assert by_status2["Exploring"] == 1

    async def test_stats_updates_after_delete(self, client, sample_dataset):
        await client.delete(f"/datasets/{sample_dataset['id']}")
        resp = await client.get("/datasets/stats")
        assert resp.json()["total"] == 0

    async def test_stats_all_types_present(self, client):
        resp = await client.get("/datasets/stats")
        data = resp.json()
        for key in ["total", "tabular", "image", "text", "audio", "by_status"]:
            assert key in data


# =============================================================================
# 8. CONCURRENCY — simultaneous requests
# =============================================================================

class TestConcurrency:
    async def test_concurrent_creates(self, client):
        tasks = [create_dataset(client, name=f"Concurrent DS {i}") for i in range(20)]
        results = await asyncio.gather(*tasks)
        assert all(r.status_code == 201 for r in results)
        ids = [r.json()["id"] for r in results]
        assert len(set(ids)) == 20, "All IDs must be unique"

    async def test_concurrent_reads(self, client, sample_dataset):
        tasks = [client.get(f"/datasets/{sample_dataset['id']}") for _ in range(30)]
        results = await asyncio.gather(*tasks)
        assert all(r.status_code == 200 for r in results)

    async def test_concurrent_updates(self, client, sample_dataset):
        ds_id = sample_dataset["id"]
        statuses = ["Exploring", "Ready for Training", "Trained", "Not Explored"]
        tasks = [
            client.put(f"/datasets/{ds_id}", json={"status": statuses[i % 4]})
            for i in range(16)
        ]
        results = await asyncio.gather(*tasks)
        assert all(r.status_code == 200 for r in results)

    async def test_concurrent_mixed_operations(self, client):
        creates = [create_dataset(client, name=f"Mix DS {i}") for i in range(10)]
        create_results = await asyncio.gather(*creates)
        ids = [r.json()["id"] for r in create_results]

        mixed = (
            [client.get("/datasets")] * 5
            + [client.get(f"/datasets/{ids[0]}")] * 5
            + [client.put(f"/datasets/{ids[1]}", json={"status": "Exploring"})] * 3
            + [client.delete(f"/datasets/{ids[-1]}")] * 1
        )
        results = await asyncio.gather(*mixed)
        assert all(r.status_code in (200, 204, 404) for r in results)

    async def test_concurrent_deletes_same_id(self, client, sample_dataset):
        """Only one delete should succeed; the rest should get 404."""
        ds_id = sample_dataset["id"]
        tasks = [client.delete(f"/datasets/{ds_id}") for _ in range(10)]
        results = await asyncio.gather(*tasks)
        successes = [r for r in results if r.status_code == 204]
        not_founds = [r for r in results if r.status_code == 404]
        assert len(successes) == 1
        assert len(not_founds) == 9


# =============================================================================
# 9. END-TO-END lifecycle
# =============================================================================

class TestLifecycle:
    async def test_full_dataset_lifecycle(self, client):
        # Create
        create_resp = await client.post("/datasets", json={
            "name": "MNIST",
            "description": "Handwritten digits",
            "type": "Image",
            "rows": 70000,
            "features": 784,
        })
        assert create_resp.status_code == 201
        ds = create_resp.json()
        ds_id = ds["id"]
        assert ds["status"] == "Not Explored"

        # Read
        get_resp = await client.get(f"/datasets/{ds_id}")
        assert get_resp.json()["name"] == "MNIST"

        # Status progression
        for status in ["Exploring", "Ready for Training", "Trained"]:
            r = await client.put(f"/datasets/{ds_id}", json={"status": status})
            assert r.json()["status"] == status

        # Update metadata
        upd_resp = await client.put(f"/datasets/{ds_id}", json={"rows": 60000, "features": 784, "description": "Updated"})
        assert upd_resp.json()["rows"] == 60000

        # Appears in list
        list_resp = await client.get("/datasets")
        assert any(d["id"] == ds_id for d in list_resp.json())

        # Appears in search
        search_resp = await client.get("/datasets?search=mnist")
        assert len(search_resp.json()) == 1

        # Stats reflect it
        stats = await client.get("/datasets/stats")
        assert stats.json()["image"] == 1
        assert stats.json()["by_status"]["Trained"] == 1

        # Delete
        del_resp = await client.delete(f"/datasets/{ds_id}")
        assert del_resp.status_code == 204

        # Gone from everywhere
        assert (await client.get(f"/datasets/{ds_id}")).status_code == 404
        assert (await client.get("/datasets")).json() == []
        assert (await client.get("/datasets/stats")).json()["total"] == 0

    async def test_bulk_create_and_mass_delete(self, client):
        resps = await asyncio.gather(*[
            create_dataset(client, name=f"Bulk DS {i}", type=["Tabular","Image","Text","Audio"][i%4])
            for i in range(50)
        ])
        ids = [r.json()["id"] for r in resps]
        assert len(ids) == 50

        stats = await client.get("/datasets/stats")
        assert stats.json()["total"] == 50

        await asyncio.gather(*[client.delete(f"/datasets/{i}") for i in ids])

        final = await client.get("/datasets")
        assert final.json() == []
