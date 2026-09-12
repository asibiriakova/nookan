.PHONY: help install install-api install-ui dev dev-api dev-ui \
        test test-api test-ui lint lint-api lint-ui build clean

help:
	@echo "Available targets:"
	@echo "  install    Install backend and frontend dependencies"
	@echo "  dev-api    Run the backend dev server (FastAPI/uvicorn)"
	@echo "  dev-ui     Run the frontend dev server (Vite)"
	@echo "  test       Run backend and frontend tests"
	@echo "  test-api   Run backend tests (pytest)"
	@echo "  test-ui    Run frontend tests (vitest)"
	@echo "  lint       Lint the backend and frontend"
	@echo "  lint-api   Lint the backend (ruff)"
	@echo "  lint-ui    Lint the frontend (oxlint)"
	@echo "  build      Build the frontend for production"
	@echo "  clean      Remove build artifacts and caches"

install: install-api install-ui

install-api:
	cd backend && uv sync

install-ui:
	cd frontend && npm install

dev-api:
	cd backend && uv run uvicorn nookan_backend.main:app --reload

dev-ui:
	cd frontend && npm run dev

test: test-api test-ui

test-api:
	cd backend && uv run pytest

test-ui:
	cd frontend && npm run test

lint: lint-api lint-ui

lint-api:
	cd backend && uv run ruff check . && uv run ruff format --check .

lint-ui:
	cd frontend && npm run lint

build:
	cd frontend && npm run build

clean:
	rm -rf frontend/dist frontend/node_modules/.vite backend/.pytest_cache
