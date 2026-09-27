# Interview Guide
## 30-second pitch
"I built SolarSight to turn rooftop-solar telemetry into performance intelligence. A FastAPI backend validates telemetry, estimates expected PV production using an explainable engineering model, and detects underperformance using normalized residuals. I added automated API tests and CI, and designed a scaling path for asynchronous telemetry ingestion."

## Why not start with deep learning?
New installations have little history. An engineering baseline works immediately, is explainable, and gives a benchmark an ML model must beat.

## Why normalized residuals?
Absolute energy deficits are scale-dependent. Ratios make signals more comparable between residential and commercial systems.

## Biggest limitation?
Weather uncertainty and single-window thresholds can cause false positives. Improve this with confidence intervals, consecutive-window rules, low-irradiance suppression, and plant-specific calibration.

## ML evaluation
Use chronological splits to prevent future leakage; compare MAE/nMAE against persistence and engineering baselines; inspect errors by season, irradiance and temperature.
