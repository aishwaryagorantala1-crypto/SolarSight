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

## Production roadmap
PostgreSQL persistence, Alembic migrations, authentication/tenant authorization, weather-provider adapters, confidence intervals, plant-specific model calibration, observability, and deployment.

**Author:** Aishwarya Gorantala

## Interactive dashboard (v2)
The dashboard runs independently of the API: `cd frontend && npm install && npm run dev -- --host 0.0.0.0`. In Codespaces, open the forwarded port 5173. The existing FastAPI endpoints remain available separately for API experimentation.

- Day/week/month charts with keyboard and pointer inspection.
- Capacity and weather scenario controls, editable INR electricity value.
- Local CSV analysis, threshold-based interval alerts, and CSV exports.
- Explicit sample-data labels and a Data & methodology page with all formulas.

CSV columns: `timestamp,actual_kwh,expected_kwh`. Each row represents energy for an interval, with actual and expected energy covering the same interval. Use ISO timestamps including a timezone (for example `2026-10-30T12:00:00Z`), nonnegative numbers, and unique timestamps. Up to 10,000 rows / 2 MB. Use the downloadable sample as a template. CSV data is processed in browser memory and is cleared on reload. All dates use UTC. Week/month selectors look back from the latest date in the data; incomplete periods show only supplied readings.

Sample data is synthetic, including a simulated midday fault. Performance score is actual/expected energy capped at 100, not a diagnosis. Estimated energy value assumes every generated kWh earns the entered tariff; it is not a utility bill prediction. Uploaded baselines are taken directly from the CSV.
