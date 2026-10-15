export type Reading = { timestamp: string; actual: number; expected: number };
export function expectedPower(
  capacity: number,
  irradiance: number,
  temperature: number,
) {
  return Math.min(
    capacity,
    Math.max(
      0,
      ((capacity * irradiance) / 1000) *
        Math.max(0, 1 - 0.0035 * (temperature + 0.03 * irradiance - 25)) *
        0.82,
    ),
  );
}
export function demoReadings(capacity: number, weather: number): Reading[] {
  return Array.from({ length: 30 * 24 }, (_, i) => {
    const day = Math.floor(i / 24),
      hour = i % 24;
    const sun = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const expected = expectedPower(capacity, sun * 900 * weather, 30);
    const fault = day === 29 && hour >= 12 && hour <= 14;
    return {
      timestamp: new Date(Date.UTC(2026, 9, day + 1, hour)).toISOString(),
      expected,
      actual: expected * (fault ? 0.48 : 0.94 + 0.04 * Math.sin(i * 1.7)),
    };
  });
}
export function parseCsv(text: string): Reading[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n/);
  if (lines.length < 2) throw Error("Add a header and at least one reading.");
  const headers = lines[0].split(",").map((x) => x.trim().toLowerCase());
  const names = ["timestamp", "actual_kwh", "expected_kwh"];
  const indexes = names.map((n) => headers.indexOf(n));
  if (indexes.some((i) => i < 0))
    throw Error(
      "Required columns: timestamp, actual_kwh, expected_kwh. Download the sample for the correct format.",
    );
  if (lines.length > 10001)
    throw Error("Please upload at most 10,000 readings.");
  const seen = new Set<string>();
  return lines
    .slice(1)
    .map((line, i) => {
      const cells = line.split(",").map((x) => x.trim());
      const [time, a, e] = indexes.map((j) => cells[j]);
      if (
        !time ||
        !a ||
        !e ||
        !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(time)
      )
        throw Error(
          `Row ${i + 2}: use an ISO timestamp with timezone, and both energy values.`,
        );
      const date = new Date(time),
        actual = Number(a),
        expected = Number(e);
      if (
        !Number.isFinite(date.getTime()) ||
        !Number.isFinite(actual) ||
        !Number.isFinite(expected) ||
        actual < 0 ||
        expected < 0
      )
        throw Error(
          `Row ${i + 2}: invalid date or negative/non-numeric energy.`,
        );
      const timestamp = date.toISOString();
      if (seen.has(timestamp))
        throw Error(`Row ${i + 2}: duplicate timestamp.`);
      seen.add(timestamp);
      return { timestamp, actual, expected };
    })
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
export function summarize(rows: Reading[]) {
  const actual = rows.reduce((s, r) => s + r.actual, 0),
    expected = rows.reduce((s, r) => s + r.expected, 0);
  const loss = rows.reduce((s, r) => s + Math.max(0, r.expected - r.actual), 0);
  return {
    actual,
    expected,
    loss,
    score: expected > 0 ? Math.min(100, (actual / expected) * 100) : null,
  };
}
