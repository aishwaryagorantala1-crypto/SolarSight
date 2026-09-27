def estimate_power(capacity_kw,irradiance_wm2,ambient_temp_c,performance_ratio=.82):
 cell_temp=ambient_temp_c+.03*irradiance_wm2
 temp_factor=max(0,1-.0035*(cell_temp-25))
 expected=capacity_kw*(irradiance_wm2/1000)*temp_factor*performance_ratio
 return {"expected_power_kw":round(min(capacity_kw,max(0,expected)),3),"temperature_factor":round(temp_factor,4)}
