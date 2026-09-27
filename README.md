# SolarSight ☀️
**Full-stack solar energy analytics, forecasting, and anomaly-detection platform.**

**Stack:** Python · FastAPI · Pydantic · React · TypeScript · Docker · pytest · GitHub Actions

## Problem
Raw inverter numbers do not tell a solar owner whether low production is normal weather variation or possible underperformance. SolarSight creates an expected-production baseline and compares actual output against it.

## Architecture
```text
PV telemetry + weather
        ↓
     FastAPI
      ├── Forecast service
      ├── Anomaly detector
      └── KPI / dashboard API
              ↓
       React + TypeScript
```

## Core analytics
The explainable baseline estimates output from installed capacity, irradiance, estimated cell temperature, temperature coefficient and performance ratio. Underperformance is measured with the normalized residual `(actual - expected) / expected`, making alerts more comparable across plant sizes.

## Run backend
```bash
cd backend
python -m venv .venv
# activate the environment
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Then open `http://localhost:8000/docs`.

## Run dashboard
```bash
cd frontend
npm install
npm run dev
```

## Tests
```bash
cd backend
pytest -q
```

## API
- `GET /health`
- `POST /api/v1/forecast`
- `POST /api/v1/anomalies`
- `GET /api/v1/demo/dashboard`

## Engineering decisions
**Explainable model before ML:** a new installation may not have enough historical data for reliable training. The engineering model works on day one and provides a benchmark that later ML must outperform.

**Separation of concerns:** HTTP routing, schemas, forecasting and anomaly detection live in separate modules, making the analytics independently testable.

**Typed validation:** invalid capacities, irradiance and temperatures are rejected at the API boundary.

**Scaling path:** production telemetry can evolve toward a durable queue, asynchronous workers, partitioned time-series storage, cached aggregates and idempotent alert delivery.

## Interview discussion
Be prepared to explain performance ratio, temperature derating, normalized residuals, false-positive control, chronological ML validation, API validation, testing, and why a modular monolith is preferable to premature microservices.

See `docs/ARCHITECTURE.md` and `docs/INTERVIEW_GUIDE.md`.

## Production roadmap
PostgreSQL persistence, Alembic migrations, authentication/tenant authorization, weather-provider adapters, confidence intervals, plant-specific model calibration, observability, and deployment.

**Author:** Aishwarya Gorantala
