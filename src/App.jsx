import { useMemo, useState } from 'react';

const defaultRoutine = `Cleanser - wash away overnight buildup\nEssence - add hydration and prep the skin\nSerum - target dullness and uneven tone\nMoisturizer - seal everything in\nSunscreen - finish with daily protection`;

const MAX_STEPS = 10;
const OPTIONAL_WORDS = ['optional', 'if needed', 'if you want', 'if desired', 'when needed'];
const SPLIT_PATTERN = /\s*(?:\.|;|\n|\bthen\b|\bnext\b|\band\b|\bafter that\b|\bafterwards\b|\/)\s*/i;

const emojiMap = [
  ['sunscreen', '☀️'],
  ['spf', '☀️'],
  ['cleanser', '🫧'],
  ['wash', '🫧'],
  ['foam', '🫧'],
  ['toner', '💧'],
  ['essence', '✨'],
  ['serum', '🧪'],
  ['ampoule', '🧴'],
  ['moisturizer', '🧴'],
  ['cream', '🧴'],
  ['oil', '🫒'],
  ['eye', '👀'],
  ['mask', '🎭'],
  ['exfol', '🌿'],
  ['retinol', '🌙'],
  ['acid', '⚗️'],
  ['spot', '🎯'],
  ['treatment', '🧩'],
];

function classifyStep(text) {
  const lower = text.toLowerCase();
  const emoji = emojiMap.find(([keyword]) => lower.includes(keyword))?.[1] ?? '🌸';
  const detail = text.trim();
  const title = buildTitle(detail);
  const optional = OPTIONAL_WORDS.some((phrase) => lower.includes(phrase));

  return {
    id: `${title}-${detail}`,
    title,
    detail,
    emoji,
    optional,
  };
}

function parseRoutine(text) {
  const rawParts = text
    .split(/\n+/)
    .flatMap((line) => line.split(SPLIT_PATTERN))
    .map((step) => step.trim())
    .filter(Boolean)
    .flatMap((step) => step.split(/\s*,\s*/))
    .map((step) => step.trim())
    .filter(Boolean)
    .flatMap((step) => splitCompoundStep(step))
    .map(normalizeStep)
    .filter(Boolean)
    .slice(0, MAX_STEPS);

  return rawParts.map(classifyStep);
}

function splitCompoundStep(step) {
  if (!step.includes(' / ')) {
    return [step];
  }

  return step
    .split(/\s*\/\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeStep(step) {
  return step
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/^step\s*\d+[:.)-]?\s*/i, '')
    .replace(/^optional[:\s-]*/i, '')
    .trim();
}

function buildTitle(detail) {
  const cleaned = detail
    .replace(/^use\s+/i, '')
    .replace(/^apply\s+/i, '')
    .replace(/^put\s+/i, '')
    .replace(/^gently\s+/i, '')
    .replace(/^then\s+/i, '')
    .trim();

  const firstChunk = cleaned.split(/[,.;:]/)[0].trim();
  const title = firstChunk.split(/\s+/).slice(0, 4).join(' ');

  return title.charAt(0).toUpperCase() + title.slice(1);
}

function App() {
  const [input, setInput] = useState(defaultRoutine);
  const [routine, setRoutine] = useState(() => parseRoutine(defaultRoutine));
  const [completed, setCompleted] = useState(() => new Set());
  const [focusMode, setFocusMode] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);

  const progress = useMemo(() => {
    if (!routine.length) {
      return 0;
    }

    return Math.round((completed.size / routine.length) * 100);
  }, [completed, routine.length]);

  const activeStep = routine[focusIndex] ?? routine[0];
  const outputJson = useMemo(() => {
    return JSON.stringify(
      {
        steps: routine.map((step, index) => ({
          step: index + 1,
          action: step.detail,
          optional: step.optional,
        })),
      },
      null,
      2
    );
  }, [routine]);

  function handleTranslate() {
    const nextRoutine = parseRoutine(input);
    setRoutine(nextRoutine);
    setCompleted(new Set());
    setFocusIndex(0);
  }

  function toggleCompleted(stepId) {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }

  function nextStep() {
    setFocusIndex((current) => Math.min(current + 1, Math.max(routine.length - 1, 0)));
  }

  function previousStep() {
    setFocusIndex((current) => Math.max(current - 1, 0));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Skincare Routine Translator</p>
          <h1>Turn a messy routine into a comic-strip checklist.</h1>
          <p className="lead">
            Paste your routine, translate it, then follow each step as a bright card with a
            quick checkbox and a focus view.
          </p>
        </div>
        <div className="hero-badge">
          <span className="hero-badge__label">Progress</span>
          <strong>{progress}%</strong>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className="controls-card">
        <label className="input-label" htmlFor="routine-input">
          Paste your skincare routine
        </label>
        <textarea
          id="routine-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Example: Cleanser - wash face. Serum - apply one thin layer. Moisturizer - seal it in."
          rows={8}
        />
        <div className="controls-row">
          <button className="primary-button" onClick={handleTranslate} type="button">
            Translate routine
          </button>
          <button
            className="secondary-button"
            onClick={() => setFocusMode((current) => !current)}
            type="button"
          >
            {focusMode ? 'Exit focus mode' : 'Focus mode'}
          </button>
        </div>
      </section>

      <section className="result-grid" aria-label="Translated skincare steps">
        {routine.length === 0 ? (
          <div className="empty-state">
            <p>No steps yet.</p>
            <span>Add the routine, then press Translate routine.</span>
          </div>
        ) : focusMode ? (
          <div className="focus-stack">
            <article className="focus-card">
              <div className="focus-topline">
                <div className="step-badge">
                  Step {focusIndex + 1} of {routine.length}
                </div>
                <div className="focus-progress">{progress}% complete</div>
              </div>
              <div className="step-emoji">{activeStep.emoji}</div>
              <h2>{activeStep.title}</h2>
              <p>{activeStep.detail}</p>
              <div className="focus-callout">
                <strong>One action only.</strong>
                <span>{activeStep.optional ? 'Optional.' : 'Required.'}</span>
              </div>
              <label className="checkbox-row">
                <input
                  checked={completed.has(activeStep.id)}
                  onChange={() => toggleCompleted(activeStep.id)}
                  type="checkbox"
                />
                <span>Done</span>
              </label>
              <div className="focus-actions">
                <button className="secondary-button" onClick={previousStep} type="button">
                  Previous
                </button>
                <button className="primary-button" onClick={nextStep} type="button">
                  Next
                </button>
              </div>
            </article>

            <article className="json-card">
              <div className="json-card__header">
                <span>JSON output</span>
                <span>{routine.length} steps</span>
              </div>
              <pre>{outputJson}</pre>
            </article>
          </div>
        ) : (
          <div className="comic-strip" aria-label="Step cards">
            {routine.map((step, index) => {
              const done = completed.has(step.id);

              return (
                <article className={`step-card ${done ? 'is-complete' : ''}`} key={step.id}>
                  <div className="step-card__header">
                    <span className="step-number">{index + 1}</span>
                    <span className="step-emoji">{step.emoji}</span>
                  </div>
                  <h2>{step.title}</h2>
                  <p>{step.detail}</p>
                  <div className="step-meta">{step.optional ? 'Optional' : 'Required'}</div>
                  <label className="checkbox-row">
                    <input
                      checked={done}
                      onChange={() => toggleCompleted(step.id)}
                      type="checkbox"
                    />
                    <span>Done</span>
                  </label>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
