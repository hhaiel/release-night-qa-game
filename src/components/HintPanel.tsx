export const HINT_COST = 100;

interface Props {
  hints: readonly string[];
  used: number;
  onTakeHint: () => void;
}

export function HintPanel({ hints, used, onTakeHint }: Props) {
  return (
    <aside className="hints" aria-labelledby="hints-title">
      <h2 id="hints-title">Hints</h2>
      {used > 0 && (
        <ol className="hints__list">
          {hints.slice(0, used).map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
      )}
      {used < hints.length ? (
        <button className="btn btn--ghost" onClick={onTakeHint}>
          Show hint {used + 1} of {hints.length} (&minus;{HINT_COST} pts)
        </button>
      ) : (
        <p className="hints__none">No hints left.</p>
      )}
    </aside>
  );
}
