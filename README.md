# FitonDuty Dashboard v2

Modern health monitoring dashboard built with React + FastAPI.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS
- **Charts**: Apache ECharts
- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **State Management**: Zustand + React Query
- **Database**: PostgreSQL (existing schema)

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL database (uses existing fitonduty schema)

### Backend Setup

```bash
cd backend

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate
uv pip install -e .

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Project Structure

```
fitonduty-dashboard-v2/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── core/           # Security, config
│   └── pyproject.toml
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── app/           # App setup, routing
│   │   ├── features/      # Feature modules
│   │   │   ├── auth/      # Authentication
│   │   │   ├── admin/     # Admin dashboard
│   │   │   ├── participant/
│   │   │   └── supervisor/
│   │   └── shared/        # Shared components
│   └── package.json
│
└── docker-compose.yml
```

## API Documentation

When running in debug mode, API docs are available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Features

### Admin Dashboard
- Multi-level filtering (groups → participants)
- Individual participant health metrics
- Anomaly detection visualization
- Data compliance monitoring

### Participant Dashboard
- Personal performance rankings
- Race visualization for gamification
- Daily health snapshot
- Health trends (7/30/90 days)

### Supervisor Dashboard
- Group overview and statistics
- Data collection monitoring
- Aggregated group metrics

## Development

### Backend

```bash
# Run tests
pytest

# Format code
ruff check --fix .

# Type checking
mypy .
```

### Frontend

```bash
# Run development server with hot reload
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint
```