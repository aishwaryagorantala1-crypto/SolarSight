# Architecture
SolarSight uses a modular FastAPI backend. The forecasting service uses an explainable PV baseline: capacity × irradiance factor × temperature factor × performance ratio. The anomaly service compares expected and actual energy using normalized residuals, making thresholds comparable across plant sizes.

## Scaling path
For high-volume telemetry: API validation → durable queue → analytics workers → partitioned time-series storage → cached aggregates → asynchronous alerts.

## Production hardening
Add PostgreSQL persistence, migrations, JWT/OIDC, tenant authorization, weather-provider adapters, confidence intervals, structured logging, metrics/traces, retries, and idempotency.
