export const HINT_COST = 100;

interface Props {
  hints: readonly string[];
  used: number;
  onTakeHint: () => void;
}

/** Widths of the fake "redacted" bars shown for locked hints. */
const REDACTED = [
  ['92%', '70%'],
  ['85%', '95%', '40%'],
  ['78%', '88%', '60%'],
];

export function HintPanel({ hints, used, onTakeHint }: Props) {
  return (
    <aside className="hints" aria-labelledby="hints-title">
      <div className="hints__head">
        <h2 id="hints-title">Debug notes</h2>
        <span className="hints__count">
          {used}/{hints.length}
        </span>
      </div>

      <ol className="hints__list">
        {hints.map((hint, i) =>
          i < used ? (
            <li key={i} className="hint hint--open">
              <span className="hint__num">0{i + 1}</span>
              <span className="hint__text">{hint}</span>
            </li>
          ) : (
            <li key={i} className="hint hint--locked">
              <span className="hint__num">0{i + 1}</span>
              <span className="hint__redacted" aria-hidden="true">
                {REDACTED[i % REDACTED.length].map((w, j) => (
                  <span key={j} style={{ width: w }} />
                ))}
              </span>
              <span className="visually-hidden">Hint {i + 1} locked</span>
            </li>
          ),
        )}
      </ol>

      {used < hints.length ? (
        <button
          className="btn btn--hint"
          onClick={onTakeHint}
          aria-label={`Decrypt hint ${used + 1} of ${hints.length} (costs ${HINT_COST} points)`}
        >
          <span aria-hidden="true">Decrypt hint {used + 1}</span>
          <span className="btn__cost" aria-hidden="true">
            &minus;{HINT_COST}
          </span>
        </button>
      ) : (
        <p className="hints__none">All notes decrypted. You&rsquo;ve got this.</p>
      )}
    </aside>
  );
}
