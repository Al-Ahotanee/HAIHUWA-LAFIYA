# Haihuwa Lafiya Initiative — 360° Motherhood Platform

A comprehensive maternal and newborn health programme management platform.

## Architecture

- **Backend**: Python 3.12+ / FastAPI / SQLAlchemy 2 / PostgreSQL (Neon)
- **Frontend**: Next.js 14 / TypeScript / Tailwind CSS / shadcn/ui
- **Hosting**: Render (Blueprint)

## Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16 (or Neon account)
- Git

## Local Development Setup

### 1. Clone & Environment

```bash
git clone <repository-url>
cd haihuwa-lafiya
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt -r requirements-dev.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
alembic upgrade head

# Seed reference data
python -m app.seeds

# Start development server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy and configure environment
cp .env.example .env.local
# Edit .env.local with API URL

# Start development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Default Development Credentials

```
Email: admin@haihuwalafiya.org
Password: dev-admin-2024!
```

> ⚠️ These credentials are for development only. Change immediately in production.

## Running Tests

```bash
# Backend
cd backend && pytest -v --cov=app

# Frontend
cd frontend && npm test
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Render deployment instructions.

## Documentation

- [SRS](docs/SRS.md) — Software Requirements Specification
- [Data Dictionary](docs/DATA_DICTIONARY.md) — Database schema documentation
- [ERD](docs/ERD.md) — Entity Relationship Diagram
- [API](docs/API.md) — API documentation
- [Security](docs/SECURITY.md) — Security documentation
- [Testing](docs/TESTING.md) — Testing strategy
- [Deployment](docs/DEPLOYMENT.md) — Deployment guide
- [Open Decisions](docs/OPEN_DECISIONS.md) — Outstanding decisions

## License

Proprietary — Haihuwa Lafiya Initiative
