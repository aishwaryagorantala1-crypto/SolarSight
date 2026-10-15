import { useEffect, useRef, useState } from "react";
import { calculatePlan, SolarPlan } from "./planModel";
import "./planner.css";
const rupees = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
function Count({ value, money = false }: { value: number; money?: boolean }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let id = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / 850);
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [value]);
  return (
    <>
      {money
        ? rupees(shown)
        : shown.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
    </>
  );
}
export default function Planner({
  initial,
  onComplete,
  onSkip,
}: {
  initial: SolarPlan | null;
  onComplete: (p: SolarPlan) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0),
    [bill, setBill] = useState(String(initial?.inputs.bill ?? 3000)),
    [fixed, setFixed] = useState(String(initial?.inputs.fixed ?? 200)),
    [tariff, setTariff] = useState(String(initial?.inputs.tariff ?? 8)),
    [units, setUnits] = useState(initial?.inputs.units == null ? "" : String(initial.inputs.units)),
    [known, setKnown] = useState(initial?.inputs.units != null),
    [roof, setRoof] = useState(initial?.inputs.roof == null ? "" : String(initial.inputs.roof)),
    [yieldDay, setYieldDay] = useState(String(initial?.inputs.yieldPerDay ?? 4)),
    [credit, setCredit] = useState(String(initial?.inputs.credit ?? 80)),
    [error, setError] = useState(""),
    [result, setResult] = useState<SolarPlan | null>(null),
    [motion, setMotion] = useState(true);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, [step]);
  function next() {
    setError("");
    if (
      step === 0 &&
      (!Number.isFinite(+bill) || +bill <= 0 || +bill > 1000000)
    ) {
      setError("Enter a monthly bill between ₹1 and ₹10,00,000.");
      return;
    }
    if (
      step === 1 &&
      (!Number.isFinite(+tariff) ||
        +tariff <= 0 ||
        +tariff > 100 ||
        +fixed < 0 ||
        +fixed >= +bill ||
        !Number.isFinite(+fixed) ||
        (known && (!Number.isFinite(+units) || +units <= 0)))
    ) {
      setError(
        "Use a positive electricity rate and usage. Fixed charges must be less than your bill.",
      );
      return;
    }
    if (step === 2) {
      try {
        const inputs = {
          bill: +bill,
          fixed: +fixed,
          tariff: +tariff,
          units: known ? +units : null,
          yieldPerDay: +yieldDay,
          roof: roof.trim() ? +roof : null,
          credit: +credit,
        };
        const plan = calculatePlan(inputs);
        setResult({ ...plan, inputs });
        setStep(3);
      } catch (e) {
        setError((e as Error).message);
      }
      return;
    }
    setStep(step + 1);
  }
  return (
    <div className={`planner ${motion ? "" : "motion-off"}`}>
      <div className="aurora a1" />
      <div className="aurora a2" />
      <div className="starfield" />
      <div className="planner-nav">
        <a href="#" className="brand">
          <span className="sun">✳</span> SolarSight.
        </a>
        <div>
          <button
            className="quiet"
            onClick={() => setMotion(!motion)}
            aria-pressed={!motion}
          >
            {motion ? "Pause motion" : "Resume motion"}
          </button>
          <button className="quiet" onClick={onSkip}>
            Explore demo ↗
          </button>
        </div>
      </div>
      <div className="planner-layout">
        <section className="planner-story">
          <div className="pill">
            <span className="tiny-dot" /> A LITTLE SUN. A DIFFERENT BILL.
          </div>
          <h1>
            Your roof.
            <br />
            Your energy.
            <br />
            <em>Your next move.</em>
          </h1>
          <p>
            I built SolarSight after working at SunSolar Power Systems. Start
            with your electricity bill and see what a rooftop solar system could
            look like for you.
          </p>
          <div className="solar-scene" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="glowing-sun" />
            <div className="sun-ray ray-one" />
            <div className="sun-ray ray-two" />
            <div className="solar-array">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} />
              ))}
            </div>
            <div className="energy-pulse" />
            <div className="scene-label">
              SUNLIGHT → ELECTRICITY → POSSIBILITIES
            </div>
          </div>
          <div className="story-foot">
            <span>01 / Tell us about your home</span>
            <span>02 / Explore your solar estimate</span>
          </div>
        </section>
        <section className="planner-card" aria-label="Personal solar estimate">
          <div className="step-header">
            <span>
              {step === 3 ? "YOUR SOLAR SNAPSHOT" : `STEP 0${step + 1} OF 03`}
            </span>
            <span>{step === 3 ? "Ready to explore" : "About a minute"}</span>
          </div>
          <div className="progress-track">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i <= step ? "filled" : ""} />
            ))}
          </div>
          <div className="step-content" key={step}>
            {step === 0 && (
              <>
                <div className="question-icon">₹</div>
                <h2 ref={title} tabIndex={-1}>
                  What does electricity
                  <br />
                  cost you each month?
                </h2>
                <p>
                  Use an average monthly bill. A typical month is fine to get
                  started.
                </p>
                <label htmlFor="bill">MONTHLY ELECTRICITY BILL</label>
                <div className="big-input">
                  <span>₹</span>
                  <input
                    id="bill"
                    type="number"
                    min="1"
                    max="1000000"
                    value={bill}
                    onChange={(e) => setBill(e.target.value)}
                  />
                  <small>/ month</small>
                </div>
                <div className="quick-values">
                  {[1500, 3000, 5000, 10000].map((n) => (
                    <button
                      className={+bill === n ? "chosen" : ""}
                      key={n}
                      onClick={() => setBill(String(n))}
                    >
                      {rupees(n)}
                    </button>
                  ))}
                </div>
                <div className="insight">
                  <span>YOUR YEAR IN ELECTRICITY</span>
                  <strong>{rupees(Math.max(0, +bill || 0) * 12)}</strong>
                  <p>That’s your current annual spend, before solar.</p>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <div className="question-icon">ϟ</div>
                <h2 ref={title} tabIndex={-1}>
                  How much electricity
                  <br />
                  does your home use?
                </h2>
                <p>
                  Your bill calls these “units.” One unit is one kWh. Solar
                  system size is measured in kW.
                </p>
                <div className="choice-row">
                  <button
                    className={!known ? "chosen" : ""}
                    onClick={() => setKnown(false)}
                  >
                    Estimate from my bill
                  </button>
                  <button
                    className={known ? "chosen" : ""}
                    onClick={() => setKnown(true)}
                  >
                    I know my units
                  </button>
                </div>
                {known && (
                  <>
                    <label htmlFor="units">MONTHLY CONSUMPTION · kWh</label>
                    <input
                      id="units"
                      type="number"
                      min="1"
                      value={units}
                      placeholder="e.g. 350"
                      onChange={(e) => setUnits(e.target.value)}
                    />
                  </>
                )}
                <div className="field-pair">
                  <div>
                    <label htmlFor="rate">RATE · ₹ / kWh</label>
                    <input
                      id="rate"
                      type="number"
                      min=".1"
                      max="100"
                      step=".1"
                      value={tariff}
                      onChange={(e) => setTariff(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="fixed">FIXED CHARGES · ₹</label>
                    <input
                      id="fixed"
                      type="number"
                      min="0"
                      value={fixed}
                      onChange={(e) => setFixed(e.target.value)}
                    />
                  </div>
                </div>
                <div className="insight">
                  <span>
                    {known ? "ENTERED MONTHLY USE" : "ESTIMATED MONTHLY USE"}
                  </span>
                  <strong>
                    {Math.max(
                      0,
                      known ? +units || 0 : (+bill - +fixed) / (+tariff || 1),
                    ).toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    <small>kWh</small>
                  </strong>
                  <p>
                    ₹8 per unit and ₹200 fixed charges are editable examples,
                    not your DISCOM’s tariff.
                  </p>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="question-icon">☀</div>
                <h2 ref={title} tabIndex={-1}>
                  Let’s make room
                  <br />
                  for some sunshine.
                </h2>
                <p>
                  A few assumptions help size your system. You can change them
                  before viewing the estimate.
                </p>
                <label htmlFor="roof">
                  SHADE-FREE ROOF AREA · sq ft <span>Optional</span>
                </label>
                <input
                  id="roof"
                  type="number"
                  min="1"
                  value={roof}
                  placeholder="Leave blank if you’re not sure"
                  onChange={(e) => setRoof(e.target.value)}
                />
                <label htmlFor="yield">
                  DAILY GENERATION PER kW · {yieldDay} kWh
                </label>
                <input
                  id="yield"
                  type="range"
                  min="2"
                  max="6"
                  step=".1"
                  value={yieldDay}
                  onChange={(e) => setYieldDay(e.target.value)}
                />
                <div className="range-labels">
                  <span>2 · Lower yield</span>
                  <span>6 · Higher yield</span>
                </div>
                <label htmlFor="credit">
                  ENERGY USED OR CREDITED AT YOUR RATE · {credit}%
                </label>
                <input
                  id="credit"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                />
                <div className="note">
                  We use 550 W panels, approximately 100 sq ft per kW, and a
                  30-day month. Yield and bill credit are planning assumptions;
                  shading, season, roof layout, and export rules change the
                  outcome.
                </div>
              </>
            )}
            {step === 3 && result && (
              <>
                <div className="result-kicker">
                  A STARTING POINT FOR YOUR HOME
                </div>
                <h2 ref={title} tabIndex={-1}>
                  {result.capacity > 0
                    ? "Your solar possibility."
                    : "Your roof needs a closer look."}
                </h2>
                <div className="capacity-result">
                  <Count value={result.capacity} />
                  <span> kW</span>
                  <small>
                    {result.panels} × 550 W panels · approx. {result.area} sq ft
                  </small>
                </div>
                <div className="result-grid">
                  <div>
                    <span>Estimated monthly reduction</span>
                    <strong>
                      <Count value={result.savings} money />
                    </strong>
                  </div>
                  <div>
                    <span>Estimated annual reduction</span>
                    <strong>
                      <Count value={result.annual} money />
                    </strong>
                  </div>
                  <div>
                    <span>Monthly solar generation</span>
                    <strong>
                      <Count value={result.generation} /> <small>kWh</small>
                    </strong>
                  </div>
                  <div>
                    <span>Estimated remaining bill</span>
                    <strong>
                      <Count value={result.remaining} money />
                    </strong>
                  </div>
                </div>
                <div className="bill-bars">
                  <div>
                    <span>Current bill</span>
                    <b>{rupees(result.inputs.bill)}</b>
                  </div>
                  <div className="bar">
                    <i style={{ width: "100%" }} />
                  </div>
                  <div>
                    <span>With solar · estimate</span>
                    <b>{rupees(result.remaining)}</b>
                  </div>
                  <div className="bar after">
                    <i
                      style={{
                        width: `${(result.remaining / result.inputs.bill) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                {result.roofLimited && (
                  <p className="roof-warning">
                    Your entered roof area limits the system size. A site survey
                    can confirm the usable space.
                  </p>
                )}
                <p className="result-disclaimer">
                  An illustrative energy estimate, not a quote or guaranteed
                  saving. Fixed charges remain; subsidies, installation costs,
                  loans, and export income are not included.
                </p>
                <details>
                  <summary>See the calculation</summary>
                  <p>
                    {result.units.toFixed(1)} monthly units ÷ (30 days ×{" "}
                    {result.inputs.yieldPerDay} kWh per kW per day), rounded up
                    to 550 W panels and limited by roof area. Bill reduction =
                    min(solar generation, consumption) × {result.inputs.credit}%
                    × ₹{result.inputs.tariff}, capped at the bill less fixed
                    charges.
                  </p>
                  <a
                    href="https://pmsuryaghar.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official rooftop solar portal ↗
                  </a>
                </details>
              </>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="planner-actions">
              {step > 0 && (
                <button
                  className="quiet"
                  onClick={() => {
                    setError("");
                    setStep(step - 1);
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                className="primary"
                onClick={() =>
                  step === 3 && result ? onComplete(result) : next()
                }
              >
                {step === 0
                  ? "Let’s work it out"
                  : step === 1
                    ? "Next: your roof"
                    : step === 2
                      ? "Show my solar estimate"
                      : "Explore my dashboard"}{" "}
                <span>→</span>
              </button>
            </div>
            <p className="privacy-note">
              No signup. Your answers stay in this browser session.
            </p>
          </div>
        </section>
      </div>
      <div className="planner-bottom">
        BUILT TO MAKE SOLAR EASIER TO UNDERSTAND{" "}
        <span>SolarSight / Aishwarya Gorantala</span>
      </div>
    </div>
  );
}
