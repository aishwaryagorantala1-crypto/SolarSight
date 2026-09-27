from pydantic import BaseModel,Field
class ForecastRequest(BaseModel):
 capacity_kw:float=Field(gt=0);irradiance_wm2:float=Field(ge=0,le=1500);ambient_temp_c:float=Field(ge=-60,le=70);performance_ratio:float=Field(default=.82,gt=0,le=1)
class Observation(BaseModel): expected_kwh:float=Field(gt=0);actual_kwh:float=Field(ge=0)
class AnomalyRequest(BaseModel): observations:list[Observation]=Field(min_length=1);threshold:float=Field(default=.25,gt=0,lt=1)
