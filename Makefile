.PHONY: help install install-backend install-frontend dev dev-backend dev-frontend \
        test test-backend test-frontend lint build clean

help:
	@echo "Available targets:"
	@echo "  install          Install backend and frontend dependencies"
	@echo "  dev-backend      Run the backend dev server (FastAPI/uvicorn)"
	@echo "  dev-frontend     Run the frontend dev server (Vite)"
	@echo "  test             Run backend and frontend tests"
	@echo "  test-backend     Run backend tests (pytest)"
	@echo "  test-frontend    Run frontend tests (vitest)"
	@echo "  lint             Lint the frontend"
	@echo "  build            Build the frontend for production"
	@echo "  clean            Remove build artifacts and caches"

install: install-backend install-frontend

install-backend:
	cd backend && uv sync

install-frontend:
	cd frontend && npm install

dev-backend:
	cd backend && uv run uvicorn nookan_backend.main:app --reload

dev-frontend:
	cd frontend && npm run dev

test: test-backend test-frontend

test-backend:
	cd backend && uv run pytest

test-frontend:
	cd frontend && npm run test

lint:
	cd frontend && npm run lint

build:
	cd frontend && npm run build

clean:
	rm -rf frontend/dist frontend/node_modules/.vite backend/.pytest_cache
