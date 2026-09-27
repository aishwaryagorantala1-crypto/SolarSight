from fastapi.testclient import TestClient
from app.main import app
c=TestClient(app)
def test_health(): assert c.get("/health").json()=={"status":"ok"}
def test_forecast(): assert c.post("/api/v1/forecast",json={"capacity_kw":10,"irradiance_wm2":800,"ambient_temp_c":30}).json()["expected_power_kw"]>0
def test_anomaly(): assert len(c.post("/api/v1/anomalies",json={"observations":[{"expected_kwh":10,"actual_kwh":6}]}).json()["anomalies"])==1
