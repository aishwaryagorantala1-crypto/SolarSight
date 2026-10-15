import { useMemo, useRef, useState } from "react";
import {
  demoReadings,
  expectedPower,
  parseCsv,
  Reading,
  summarize,
} from "./analytics";
const number = (v: number, d = 1) =>
  v.toLocaleString("en-IN", { maximumFractionDigits: d });
const money = (v: number) => `₹${number(v, 0)}`;
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function Chart({ rows, day }: { rows: Reading[]; day: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const max =
    Math.max(1, ...rows.flatMap((r) => [r.actual, r.expected])) * 1.15;
  const x = (i: number) => 54 + (i / Math.max(1, rows.length - 1)) * 820,
    y = (v: number) => 245 - (v / max) * 210;
  const points = (key: "actual" | "expected") =>
    rows.map((r, i) => `${x(i)},${y(r[key])}`).join(" ");
  const label = (r: Reading) =>
    day ? r.timestamp.slice(11, 16) : r.timestamp.slice(5, 10);
  const current = active === null ? null : rows[active];
  return (
    <div className="chart-wrap">
      <svg
        viewBox="0 0 920 290"
        role="img"
        aria-label="Actual and expected energy generation in kilowatt-hours"
      >
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#ecab50" stopOpacity=".25" />
            <stop offset="1" stopColor="#ecab50" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="54"
              x2="874"
              y1={y((max * i) / 4)}
              y2={y((max * i) / 4)}
              stroke="#27352f"
              strokeDasharray="3 5"
            />
            <text x="42" y={y((max * i) / 4) + 4} textAnchor="end">
              {number((max * i) / 4)}
            </text>
          </g>
        ))}
        <polygon
          points={`54,245 ${points("actual")} ${x(rows.length - 1)},245`}
          fill="url(#area)"
        />
        <polyline
          points={points("expected")}
          fill="none"
          stroke="#8ba89b"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <polyline
          points={points("actual")}
          fill="none"
          stroke="#f6b85b"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {rows.map((r, i) => (
          <g key={r.timestamp}>
            {(i % Math.max(1, Math.ceil(rows.length / 8)) === 0 ||
              i === rows.length - 1) && (
              <text x={x(i)} y="274" textAnchor="middle">
                {label(r)}
              </text>
            )}
            <rect
              x={x(i) - Math.max(5, 410 / Math.max(1, rows.length - 1))}
              y="20"
              width={Math.max(10, 820 / Math.max(1, rows.length - 1))}
              height="230"
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${label(r)}: actual ${number(r.actual)} kWh, expected ${number(r.expected)} kWh`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              onMouseLeave={() => setActive(null)}
            />
          </g>
        ))}
        {current && (
          <g pointerEvents="none">
            <line
              x1={x(active!)}
              x2={x(active!)}
              y1="25"
              y2="245"
              stroke="#f6b85b"
            />
            <circle
              cx={x(active!)}
              cy={y(current.actual)}
              r="5"
              fill="#f6b85b"
            />
          </g>
        )}
      </svg>
      <div className="chart-caption">
        {current
          ? `${label(current)} UTC · Actual ${number(current.actual, 2)} kWh · Expected ${number(current.expected, 2)} kWh`
          : "Hover or tab across the chart to inspect readings · Times in UTC"}
      </div>
    </div>
  );
}
export default function App() {
  const [range, setRange] = useState(1),
    [capacity, setCapacity] = useState(11.2),
    [weather, setWeather] = useState(1),
    [tariff, setTariff] = useState(8),
    [threshold, setThreshold] = useState(25),
    [uploaded, setUploaded] = useState<Reading[] | null>(null),
    [fileName, setFileName] = useState(""),
    [error, setError] = useState(""),
    [tab, setTab] = useState("Overview");
  const file = useRef<HTMLInputElement>(null);
  const all = useMemo(
    () => uploaded ?? demoReadings(capacity, weather),
    [uploaded, capacity, weather],
  );
  const end = all[all.length - 1].timestamp.slice(0, 10);
  const start = Date.parse(end + "T00:00:00Z") - (range - 1) * 86400000;
  const rows = useMemo(() => all.filter((r) => Date.parse(r.timestamp) >= start), [all, start]);
  const totals = summarize(rows);
  const chartRows = useMemo(() => {
    if (range === 1) return rows;
    const grouped = new Map<string, Reading>();
    rows.forEach((r) => {
      const date = r.timestamp.slice(0, 10);
      const entry = grouped.get(date) ?? {
        timestamp: date + "T00:00:00Z",
        actual: 0,
        expected: 0,
      };
      entry.actual += r.actual;
      entry.expected += r.expected;
      grouped.set(date, entry);
    });
    return [...grouped.values()];
  }, [rows, range]);
  const alerts = rows.filter(
    (r) =>
      r.expected > 0 && (r.expected - r.actual) / r.expected >= threshold / 100,
  );
  const csv = (data: Reading[]) =>
    "timestamp,actual_kwh,expected_kwh\n" +
    data
      .map(
        (r) => `${r.timestamp},${r.actual.toFixed(3)},${r.expected.toFixed(3)}`,
      )
      .join("\n");
  async function upload(f: File) {
    try {
      if (f.size > 2_000_000)
        throw Error("Please use a CSV smaller than 2 MB.");
      const readings = parseCsv(await f.text());
      setUploaded(readings);
      setFileName(f.name);
      setError("");
      setTab("Overview");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="#">
          <span className="sun">✳</span> SolarSight
          <span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="avatar">SS</span>
          <div>
            Solar workspace<small>Performance intelligence</small>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {["Overview", "Performance alerts", "Data & methodology"].map(
            (t, i) => (
              <button
                className={tab === t ? "selected" : ""}
                onClick={() => setTab(t)}
                key={t}
              >
                <span>{["▦", "⚑", "▤"][i]}</span>
                {t}
                {i === 1 && <b>{alerts.length}</b>}
              </button>
            ),
          )}
        </nav>
        <div className="side-note">
          <span className="tiny-dot" />{" "}
          {uploaded ? "CSV analysis" : "Interactive demo"}
          <p>
            {uploaded
              ? "Your data stays in this browser."
              : "Explore a sample Hyderabad rooftop installation."}
          </p>
          <small>SolarSight / v2.0</small>
        </div>
      </aside>
      <main>
        <div className="topbar">
          <span>
            Workspace <span className="slash">/</span> <b>{tab}</b>
          </span>
          <span className="badge">
            {uploaded ? "UPLOADED DATA" : "SAMPLE DATA · OCT 2026"}
          </span>
        </div>
        <header>
          <div>
            <div className="eyebrow">SOLAR PERFORMANCE, MADE CLEAR</div>
            <h1>
              {tab === "Overview" ? "Every kilowatt tells a story." : tab}
            </h1>
            <p>
              {uploaded ? fileName : "Hyderabad rooftop"} <span>·</span>{" "}
              {uploaded
                ? "Interval energy analysis"
                : `${capacity} kW installation`}{" "}
              <span>·</span> Through {end}
            </p>
          </div>
          <button className="primary" onClick={() => file.current?.click()}>
            ↑ Import CSV
          </button>
          <input
            ref={file}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              if (e.target.files?.[0]) void upload(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </header>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="toolbar">
          <div>
            <span className="tiny-dot" />{" "}
            {uploaded ? "Analyzing your readings" : "Demo mode"}
            <span className="muted">
              {" "}
              · {rows.length} readings in selected period
            </span>
          </div>
          <div className="segmented">
            {[1, 7, 30].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={range === r ? "active" : ""}
              >
                {r === 1 ? "Day" : r === 7 ? "Week" : "Month"}
              </button>
            ))}
          </div>
        </div>
        {tab === "Overview" && (
          <>
            <section className="metrics">
              <article>
                <label>
                  ENERGY GENERATED <span>↗</span>
                </label>
                <strong>
                  {number(totals.actual)} <small>kWh</small>
                </strong>
                <p>
                  Across the selected {range === 1 ? "day" : `${range} days`}
                </p>
              </article>
              <article>
                <label>
                  EXPECTED GENERATION <span>☀</span>
                </label>
                <strong>
                  {number(totals.expected)} <small>kWh</small>
                </strong>
                <p>
                  {uploaded
                    ? "Baseline supplied in your CSV"
                    : "Weather-adjusted model baseline"}
                </p>
              </article>
              <article>
                <label>
                  PERFORMANCE SCORE <span>◉</span>
                </label>
                <strong>
                  {totals.score === null ? "—" : number(totals.score, 0)}{" "}
                  <small>/ 100</small>
                </strong>
                <p>
                  <span className="amber">
                    {totals.expected
                      ? `${number((totals.actual / totals.expected - 1) * 100)}% vs expected`
                      : "No baseline energy"}
                  </span>
                </p>
              </article>
              <article>
                <label>
                  EST. ENERGY VALUE <span>₹</span>
                </label>
                <strong>{money(totals.actual * tariff)}</strong>
                <p>At {money(tariff)}/kWh · selected period</p>
              </article>
            </section>
            <div className="main-grid">
              <section className="panel production">
                <div className="panel-heading">
                  <div>
                    <h2>Production overview</h2>
                    <p>Actual output against the expected baseline</p>
                  </div>
                  <div className="legend">
                    <span className="actual">● Actual</span>
                    <span>┄ Expected</span>
                  </div>
                </div>
                <div className="axis-label">ENERGY / kWh</div>
                <Chart rows={chartRows} day={range === 1} />
              </section>
              <section className="panel simulator">
                <span className="eyebrow">EXPLORE THE NUMBERS</span>
                <h2>What if?</h2>
                <p>Adjust your installation and see the impact.</p>
                <label>
                  System capacity <b>{capacity} kW</b>
                </label>
                <input
                  aria-label="System capacity"
                  type="range"
                  min="1"
                  max="50"
                  step=".1"
                  value={capacity}
                  disabled={!!uploaded}
                  onChange={(e) => setCapacity(+e.target.value)}
                />
                <label>Weather conditions</label>
                <select
                  aria-label="Weather conditions"
                  value={weather}
                  disabled={!!uploaded}
                  onChange={(e) => setWeather(+e.target.value)}
                >
                  <option value="1">☀ Clear skies</option>
                  <option value="0.65">Partly cloudy</option>
                  <option value="0.35">Overcast</option>
                </select>
                <label>
                  Electricity value <b>₹ / kWh</b>
                </label>
                <input
                  aria-label="Electricity tariff"
                  type="number"
                  min="0"
                  max="100"
                  step=".5"
                  value={tariff}
                  onChange={(e) =>
                    setTariff(Math.max(0, Math.min(100, +e.target.value)))
                  }
                />
                <div className="simulation-result">
                  <span>Modeled midday power</span>
                  <strong>
                    {number(expectedPower(capacity, 900 * weather, 30), 2)}{" "}
                    <small>kW</small>
                  </strong>
                </div>
                <small>
                  {uploaded
                    ? "Capacity and weather are disabled for CSV data. The midday estimate is illustrative."
                    : "Scenario changes regenerate sample readings, not a live weather forecast."}
                </small>
              </section>
            </div>
          </>
        )}
        {tab !== "Data & methodology" && (
          <section className="panel alerts">
            <div className="panel-heading">
              <div>
                <h2>
                  Signals worth your attention{" "}
                  <span className="count">{alerts.length}</span>
                </h2>
                <p>
                  Flagging intervals at least {threshold}% below expected
                  generation
                </p>
              </div>
              <label className="threshold">
                Threshold{" "}
                <select
                  aria-label="Alert threshold"
                  value={threshold}
                  onChange={(e) => setThreshold(+e.target.value)}
                >
                  {[10, 25, 40, 50].map((v) => (
                    <option key={v} value={v}>
                      {v}%
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {alerts.length === 0 ? (
              <div className="empty">
                ✓ No intervals cross this threshold in the selected period.
              </div>
            ) : (
              <>
                <div className="alert-summary">
                  <span className="warning-icon">!</span>
                  <div>
                    <b>Underperformance detected</b>
                    <p>
                      {number(totals.loss)} kWh below baseline across deficient
                      intervals · estimated opportunity{" "}
                      {money(totals.loss * tariff)}
                    </p>
                  </div>
                  <span className="tag">REVIEW RECOMMENDED</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>INTERVAL (UTC)</th>
                        <th>ACTUAL</th>
                        <th>EXPECTED</th>
                        <th>SHORTFALL</th>
                        <th>SEVERITY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.slice(0, 20).map((r) => (
                        <tr key={r.timestamp}>
                          <td>
                            {r.timestamp.slice(0, 16).replace("T", " · ")}
                          </td>
                          <td>{number(r.actual, 2)} kWh</td>
                          <td>{number(r.expected, 2)} kWh</td>
                          <td className="amber">
                            −{number((1 - r.actual / r.expected) * 100)}%
                          </td>
                          <td>
                            <span className="severity">
                              {r.actual / r.expected <= 0.5
                                ? "High"
                                : "Moderate"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {alerts.length > 20 && (
                  <p>
                    Showing 20 of {alerts.length} flagged intervals. Export the
                    period for all readings.
                  </p>
                )}
                <div className="recommendation">
                  <b>Next step</b> Compare inverter logs and weather records,
                  then check for shading, soiling, or downtime. These flags
                  identify deviations; they do not diagnose the cause.
                </div>
              </>
            )}
          </section>
        )}
        {tab === "Data & methodology" && (
          <section className="panel methodology">
            <h2>Transparent inputs. Explainable results.</h2>
            <p>
              Upload interval energy readings with three columns:{" "}
              <code>timestamp, actual_kwh, expected_kwh</code>. Values must
              represent the same interval. Use ISO timestamps with a timezone,
              such as <code>2026-10-30T12:00:00Z</code>. Zero energy is allowed;
              duplicates and negative values are rejected.
            </p>
            <h3>How we calculate</h3>
            <p>
              <b>Performance score:</b> total actual energy ÷ total expected
              energy × 100, capped at 100. This is a baseline comparison, not an
              equipment health diagnosis.
            </p>
            <p>
              <b>Energy value:</b> generated kWh × your electricity value. This
              assumes every generated unit is worth the entered rate; actual
              bill savings depend on self-consumption, export compensation, and
              fixed charges.
            </p>
            <p>
              <b>Shortfall:</b> sum of positive differences between expected and
              actual interval energy. Overproduction in other intervals does not
              cancel these losses.
            </p>
            <p>
              <b>Demo forecast:</b> capacity × irradiance / 1,000 × temperature
              adjustment × 0.82 performance ratio, capped at rated capacity.
              Cell temperature is estimated as ambient temperature + 0.03 ×
              irradiance. The temperature coefficient is −0.35%/°C relative to
              25°C.
            </p>
            <p>
              Sample data consists of 30 synthetic days in October 2026 with
              hourly intervals. The final day contains a simulated midday fault.
              CSV baselines come from your file; changing the scenario never
              modifies uploaded readings. Dates and charts use UTC, and
              week/month views end on the latest uploaded date.
            </p>
            <button
              onClick={() =>
                download("solarsight-sample.csv", csv(demoReadings(11.2, 1)))
              }
            >
              ↓ Download sample CSV
            </button>
          </section>
        )}
        <footer>
          <span>
            ✳ SolarSight{" "}
            <span className="muted"> / Understand your energy.</span>
          </span>
          <div>
            {uploaded && (
              <button
                onClick={() => {
                  setUploaded(null);
                  setFileName("");
                  setError("");
                }}
              >
                Reset demo
              </button>
            )}
            <button
              onClick={() => download("solarsight-analysis.csv", csv(rows))}
            >
              ↓ Export period
            </button>
            <button
              onClick={() =>
                download("solarsight-sample.csv", csv(demoReadings(11.2, 1)))
              }
            >
              Sample CSV
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
