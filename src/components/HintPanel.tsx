export const HINT_COST = 100;

interface Props {
  hints: readonly string[];
  used: number;
  onTakeHint: () => void;
}

/** Hints as sealed envelopes. Opening one costs points; opened ones read like notes from a colleague. */
export function HintPanel({ hints, used, onTakeHint }: Props) {
  return (
    <aside className="hints" aria-labelledby="hints-title">
      <div className="hints__head">
        <h2 id="hints-title">Hints</h2>
        <span className="hints__count">
          {used} of {hints.length} opened
        </span>
      </div>

      <ol className="hints__list">
        {hints.map((hint, i) =>
          i < used ? (
            <li key={i} className="hint hint--open">
              <span className="hint__label">Hint {String(i + 1).padStart(2, '0')}</span>
              <span className="hint__text">{hint}</span>
            </li>
          ) : (
            <li key={i} className="hint hint--sealed">
              <span className="hint__label" aria-hidden="true">
                Hint {String(i + 1).padStart(2, '0')}
              </span>
              <span className="hint__seal" aria-hidden="true">
                Sealed
              </span>
              <span className="visually-hidden">Hint {i + 1} locked</span>
            </li>
          ),
        )}
      </ol>

      {used < hints.length ? (
        // The visible text IS the accessible name (WCAG 2.5.3 "label in name"): no aria-label here.
        <button className="btn btn--hint" onClick={onTakeHint}>
          <span>Open hint {used + 1}</span>
          <span className="btn__cost">&minus;{HINT_COST} pts</span>
        </button>
      ) : (
        <p className="hints__none">All hints opened.</p>
      )}
    </aside>
  );
}
