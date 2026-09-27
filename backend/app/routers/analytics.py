from fastapi import APIRouter
from app.schemas import ForecastRequest,AnomalyRequest
from app.services.forecast import estimate_power
from app.services.anomaly import detect
router=APIRouter()
@router.post("/forecast")
def forecast(p:ForecastRequest): return estimate_power(p.capacity_kw,p.irradiance_wm2,p.ambient_temp_c,p.performance_ratio)
@router.post("/anomalies")
def anomalies(p:AnomalyRequest): return detect(p.observations,p.threshold)
@router.get("/demo/dashboard")
def demo(): return {"plant":"Demo Rooftop PV","capacity_kw":11.2,"today_kwh":47.8,"expected_kwh":51.4,"health_score":93,"estimated_monthly_savings":128.4}
