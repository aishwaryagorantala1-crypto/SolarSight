export type PlanInputs = {
  bill: number;
  fixed: number;
  tariff: number;
  units: number | null;
  yieldPerDay: number;
  roof: number | null;
  credit: number;
};
export function calculatePlan(p: PlanInputs) {
  if (
    ![p.bill, p.fixed, p.tariff, p.yieldPerDay, p.credit].every(
      Number.isFinite,
    ) ||
    p.bill <= 0 ||
    p.fixed < 0 ||
    p.fixed >= p.bill ||
    p.tariff <= 0 ||
    p.yieldPerDay <= 0 ||
    p.credit < 0 ||
    p.credit > 100 ||
    (p.units !== null && (!Number.isFinite(p.units) || p.units <= 0)) ||
    (p.roof !== null && (!Number.isFinite(p.roof) || p.roof <= 0))
  )
    throw Error("Please check your bill, usage, and assumptions.");
  const units = p.units ?? (p.bill - p.fixed) / p.tariff;
  const neededPanels = Math.ceil(units / (30 * p.yieldPerDay * 0.55));
  const roofPanels = p.roof === null ? neededPanels : Math.floor(p.roof / 55);
  const panels = Math.max(0, Math.min(neededPanels, roofPanels));
  const capacity = panels * 0.55,
    generation = capacity * p.yieldPerDay * 30;
  const useful = (Math.min(units, generation) * p.credit) / 100;
  const savings = Math.min(p.bill - p.fixed, useful * p.tariff);
  return {
    units,
    panels,
    capacity,
    generation,
    savings,
    remaining: p.bill - savings,
    annual: savings * 12,
    coverage: Math.min(100, (generation / units) * 100),
    area: panels * 55,
    roofLimited: panels < neededPanels,
  };
}
export type SolarPlan = ReturnType<typeof calculatePlan> & {
  inputs: PlanInputs;
};
