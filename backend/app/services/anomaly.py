def detect(points,threshold):
 alerts=[];penalty=0
 for i,p in enumerate(points):
  residual=(p.actual_kwh-p.expected_kwh)/p.expected_kwh; deficit=max(0,-residual);penalty+=min(deficit,1)
  if deficit>=threshold: alerts.append({"index":i,"residual_ratio":round(residual,4),"severity":"critical" if deficit>=.5 else "warning"})
 return {"anomalies":alerts,"health_score":round(max(0,100*(1-penalty/len(points))),1)}
