from fastapi import FastAPI
from app.routers.analytics import router
app=FastAPI(title="SolarSight API",version="1.0.0")
app.include_router(router,prefix="/api/v1",tags=["analytics"])
@app.get("/health")
def health(): return {"status":"ok"}
