# Backend baseline — 2026-10-18

## Scope

This run verified the documented backend test command against the `production`
branch in an isolated Python 3.12 environment. It fixes one reproducible
dependency failure and records the remaining concurrency-test failures without
changing application behavior.

## Environment

- Python 3.12.14
- pytest 9.1.1
- pytest-asyncio 1.4.0
- FastAPI 0.146.0
- SQLAlchemy 2.1.5
- aiosqlite 0.22.1
- httpx 0.28.1

## Reproduction

From the repository root:

```bash
python -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt pytest pytest-asyncio httpx
cd backend
../.venv/bin/python -m pytest test_api.py -v
```

Before the dependency fix, collection stopped with:

```text
ImportError: The SQLAlchemy asyncio module requires that the Python 'greenlet'
library is installed.
```

## Fix

`backend/requirements.txt` now requests `sqlalchemy[asyncio]>=2.0.0` instead of
the base SQLAlchemy package. The documented install therefore includes
`greenlet`, which SQLAlchemy's async module requires in this environment.

## Verification result

After reinstalling the requirements, all 66 tests collected successfully.
The final result was:

```text
60 passed, 6 failed, 1 error in 3.87s
```

The ordinary CRUD, validation, read, update, delete, statistics, and primary
lifecycle coverage passed. The remaining failures are confined to concurrent
operations and one related teardown error:

- `TestConcurrency::test_concurrent_creates`
- `TestConcurrency::test_concurrent_reads`
- `TestConcurrency::test_concurrent_updates`
- `TestConcurrency::test_concurrent_mixed_operations`
- `TestConcurrency::test_concurrent_deletes_same_id`
- `TestLifecycle::test_bulk_create_and_mass_delete`
- teardown of `TestConcurrency::test_concurrent_updates`

Observed errors include SQLite reporting `cannot commit transaction - SQL
statements in progress` and an `asyncio.Lock` bound to a different event loop.
The suite uses one module-level in-memory SQLite async engine while
pytest-asyncio provides function-scoped loops. That combination is the next
area to isolate; no second fix is included in this bounded change.

## Next action

Make the async test database lifecycle explicit for concurrent tests (for
example, a per-session temporary file database and an engine created and
disposed inside a fixture), then rerun the complete 66-test command. Keep that
as a separate reviewable change.
