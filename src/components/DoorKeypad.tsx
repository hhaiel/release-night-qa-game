import { useId, useRef, useState, type FormEvent } from 'react';
import { checkAnswer } from '../lib/api';
import type { DoorConfig } from '../game/types';

interface Props {
  roomId: string;
  door: DoorConfig;
  onSolved: () => void;
}

type Status = 'idle' | 'checking' | 'denied' | 'error';

/** The locked door under a room: type the code you found, the server checks it. */
export function DoorKeypad({ roomId, door, onSolved }: Props) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const formRef = useRef<HTMLFormElement>(null);
  const inputId = useId();
  const statusId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setStatus('checking');
    try {
      if (await checkAnswer(roomId, code)) {
        onSolved();
      } else {
        setStatus('denied');
        shake();
      }
    } catch {
      setStatus('error');
    }
  }

  /** A short "wrong code" shake. Skipped for people who prefer less motion. */
  function shake() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    formRef.current?.animate(
      [0, -8, 8, -6, 6, -3, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 420, easing: 'ease-out' },
    );
  }

  const led = status === 'denied' || status === 'error' ? 'red' : status === 'checking' ? 'amber' : 'off';

  return (
    <form className={`keypad keypad--${status}`} onSubmit={handleSubmit} ref={formRef}>
      <div className="keypad__plate" aria-hidden="true">
        <span className={`keypad__led keypad__led--${led}`} />
        <span className="keypad__label">Door lock</span>
      </div>

      <div className="keypad__field">
        <label htmlFor={inputId}>{door.prompt}</label>
        <div className="keypad__row">
          <input
            id={inputId}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (status !== 'checking') setStatus('idle');
            }}
            placeholder={door.placeholder}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={statusId}
            aria-invalid={status === 'denied'}
          />
          <button type="submit" className="btn btn--primary" disabled={status === 'checking'}>
            {status === 'checking' ? 'Checking…' : 'Unlock'}
          </button>
        </div>
        <p id={statusId} className="keypad__status" role="status">
          {status === 'denied' && 'Access denied. That code doesn’t open this door.'}
          {status === 'error' && 'The lock isn’t responding. Is the server running?'}
        </p>
      </div>
    </form>
  );
}
