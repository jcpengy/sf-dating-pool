import { useMemo, useState } from 'react';
import pumsData from './data/pums-cube.json';

type Choice = 'any' | 'yes' | 'no';
type MaritalChoice = 'any' | 'not-married' | 'married';
type IncomeChoice = 0 | 1 | 2 | 3 | 4;

type Cell = {
  a: number;
  i: number;
  c: number;
  m: number;
  t: number;
  w: number;
  r: number[];
};

type Filters = {
  minimumAge: number;
  maximumAge: number;
  income: IncomeChoice;
  children: Choice;
  marital: MaritalChoice;
  tech: Choice;
};

const cells = pumsData.cells as Cell[];
const ageOptions = Array.from({ length: 60 }, (_, index) => index + 21);
const steps = ['Age', 'Income', 'Children', 'Relationship', 'Tech'];

const initialFilters: Filters = {
  minimumAge: 21,
  maximumAge: 80,
  income: 0,
  children: 'any',
  marital: 'any',
  tech: 'any',
};

const incomeLabels = ['Any income', '$50k+', '$100k+', '$150k+', '$250k+'];

function matches(cell: Cell, filters: Filters) {
  if (cell.a < filters.minimumAge || cell.a > filters.maximumAge) return false;
  if (cell.i < filters.income) return false;
  if (filters.children === 'yes' && cell.c !== 1) return false;
  if (filters.children === 'no' && cell.c !== 0) return false;
  if (filters.marital === 'married' && cell.m !== 1) return false;
  if (filters.marital === 'not-married' && cell.m !== 0) return false;
  if (filters.tech === 'yes' && cell.t !== 1) return false;
  if (filters.tech === 'no' && cell.t !== 0) return false;
  return true;
}

function estimate(filters: Filters) {
  const included = cells.filter((cell) => matches(cell, filters));
  const value = included.reduce((sum, cell) => sum + cell.w, 0);
  const replicates = Array.from({ length: 80 }, (_, index) =>
    included.reduce((sum, cell) => sum + (cell.r[index] ?? 0), 0),
  );
  const variance = replicates.reduce((sum, replicate) => sum + (replicate - value) ** 2, 0) * (4 / 80);
  const margin = 1.645 * Math.sqrt(variance);
  return { value, margin };
}

function rounded(value: number) {
  if (value <= 0) return '0';
  const increment = value < 100_000 ? 500 : 1_000;
  return Math.round(value / increment) * increment;
}

function formatted(value: number) {
  return Number(rounded(value)).toLocaleString('en-US');
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className="choice" data-selected={selected} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export default function App() {
  const [filters, setFilters] = useState(initialFilters);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const result = useMemo(() => estimate(filters), [filters]);
  const base = pumsData.metadata.totalWeight;
  const percent = base ? Math.min(100, (result.value / base) * 100) : 0;
  const low = Math.max(0, result.value - result.margin);
  const high = result.value + result.margin;

  function update(next: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...next }));
  }

  function next() {
    if (step === steps.length - 1) setComplete(true);
    else setStep((current) => current + 1);
  }

  function restart() {
    setFilters(initialFilters);
    setStep(0);
    setComplete(false);
  }

  return (
    <main>
      <header className="intro">
        <p className="eyebrow">SF dating pool</p>
        <h1>How many people fit your type?</h1>
        <p>Choose a few traits and watch San Francisco’s estimated pool change.</p>
      </header>

      <section className="estimate" aria-live="polite" aria-atomic="true">
        <p className="estimate-label">Estimated pool</p>
        <p className="estimate-value">About {formatted(result.value)}</p>
        <p className="estimate-context">
          {percent.toFixed(percent < 10 ? 1 : 0)}% of SF residents age 21+
        </p>
        <div className="meter" aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </div>
        <p className="range">90% range: {formatted(low)}–{formatted(high)}</p>
      </section>

      <section className="card-stack" aria-label="Preference builder">
        <div className="card-shadow" aria-hidden="true" />
        <div className="preference-card">
          {!complete ? (
            <>
              <div className="card-topline">
                <span>{steps[step]}</span>
                <span>{step + 1} / {steps.length}</span>
              </div>

              {step === 0 && (
                <div className="question">
                  <h2>What age range?</h2>
                  <div className="age-fields">
                    <label>
                      From
                      <select
                        value={filters.minimumAge}
                        onChange={(event) => {
                          const minimumAge = Number(event.target.value);
                          update({ minimumAge, maximumAge: Math.max(minimumAge, filters.maximumAge) });
                        }}
                      >
                        {ageOptions.map((age) => <option key={age}>{age}</option>)}
                      </select>
                    </label>
                    <span>to</span>
                    <label>
                      Through
                      <select
                        value={filters.maximumAge}
                        onChange={(event) => update({ maximumAge: Number(event.target.value) })}
                      >
                        {ageOptions.filter((age) => age >= filters.minimumAge).map((age) => (
                          <option key={age} value={age}>{age === 80 ? '80+' : age}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="question">
                  <h2>Minimum personal income?</h2>
                  <p className="helper">Before taxes, during the past 12 months.</p>
                  <div className="choices">
                    {incomeLabels.map((label, index) => (
                      <ChoiceButton
                        key={label}
                        selected={filters.income === index}
                        onClick={() => update({ income: index as IncomeChoice })}
                      >
                        {label}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="question">
                  <h2>Children in the household?</h2>
                  <p className="helper">Related children under 18 living at home.</p>
                  <div className="choices">
                    <ChoiceButton selected={filters.children === 'any'} onClick={() => update({ children: 'any' })}>Doesn’t matter</ChoiceButton>
                    <ChoiceButton selected={filters.children === 'no'} onClick={() => update({ children: 'no' })}>No children at home</ChoiceButton>
                    <ChoiceButton selected={filters.children === 'yes'} onClick={() => update({ children: 'yes' })}>Children at home</ChoiceButton>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="question">
                  <h2>Current marital status?</h2>
                  <p className="helper">“Not married” does not necessarily mean single or available.</p>
                  <div className="choices">
                    <ChoiceButton selected={filters.marital === 'any'} onClick={() => update({ marital: 'any' })}>Doesn’t matter</ChoiceButton>
                    <ChoiceButton selected={filters.marital === 'not-married'} onClick={() => update({ marital: 'not-married' })}>Not currently married</ChoiceButton>
                    <ChoiceButton selected={filters.marital === 'married'} onClick={() => update({ marital: 'married' })}>Currently married</ChoiceButton>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="question">
                  <h2>Works in tech?</h2>
                  <p className="helper">A computer or mathematical role, or a narrowly defined computing industry.</p>
                  <div className="choices">
                    <ChoiceButton selected={filters.tech === 'any'} onClick={() => update({ tech: 'any' })}>Doesn’t matter</ChoiceButton>
                    <ChoiceButton selected={filters.tech === 'yes'} onClick={() => update({ tech: 'yes' })}>Yes</ChoiceButton>
                    <ChoiceButton selected={filters.tech === 'no'} onClick={() => update({ tech: 'no' })}>No</ChoiceButton>
                  </div>
                </div>
              )}

              <div className="navigation">
                <button
                  className="back"
                  type="button"
                  disabled={step === 0}
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                >
                  Back
                </button>
                <button className="next" type="button" onClick={next}>
                  {step === steps.length - 1 ? 'See summary' : 'Next'}
                </button>
              </div>
            </>
          ) : (
            <div className="summary">
              <p className="card-topline"><span>Your estimate</span><span>Complete</span></p>
              <h2>About {formatted(result.value)} SF adults match.</h2>
              <ul>
                <li><span>Age</span><strong>{filters.minimumAge}–{filters.maximumAge === 80 ? '80+' : filters.maximumAge}</strong></li>
                <li><span>Income</span><strong>{incomeLabels[filters.income]}</strong></li>
                <li><span>Children</span><strong>{filters.children === 'any' ? 'Any' : filters.children === 'yes' ? 'At home' : 'None at home'}</strong></li>
                <li><span>Marital status</span><strong>{filters.marital === 'any' ? 'Any' : filters.marital === 'married' ? 'Married' : 'Not married'}</strong></li>
                <li><span>Tech</span><strong>{filters.tech === 'any' ? 'Any' : filters.tech === 'yes' ? 'Yes' : 'No'}</strong></li>
              </ul>
              <div className="summary-actions">
                <button className="back" type="button" onClick={() => { setComplete(false); setStep(0); }}>Edit answers</button>
                <button className="next" type="button" onClick={restart}>Start over</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer>
        <p>
          Weighted 2024 American Community Survey PUMS estimate. It describes residents—not people who are single, available, mutually interested, or using dating apps.
        </p>
        <a href={pumsData.metadata.sourceUrl} target="_blank" rel="noreferrer">Source and methodology</a>
      </footer>
    </main>
  );
}
