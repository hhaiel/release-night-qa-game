import { useId, useRef, useState, type FormEvent } from 'react';
import { checkAnswer } from '../lib/api';
import type { DoorConfig } from '../game/types';

interface Props {
  roomId: string;
  roomNumber: number;
  door: DoorConfig;
  onSolved: () => void;
}

type Status = 'idle' | 'checking' | 'denied' | 'error';

const STATUS_WORD: Record<Status, string> = {
  idle: 'Locked',
  checking: 'Checking',
  denied: 'Denied',
  error: 'Offline',
};

/** The access panel next to the door: type the code you found, the server checks it. */
export function DoorKeypad({ roomId, roomNumber, door, onSolved }: Props) {
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
      [0, -6, 6, -4, 4, -2, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 380, easing: 'ease-out' },
    );
  }

  const led = status === 'denied' || status === 'error' ? 'red' : status === 'checking' ? 'amber' : 'off';

  return (
    <form className={`keypad keypad--${status}`} onSubmit={handleSubmit} ref={formRef}>
      <div className="keypad__top" aria-hidden="true">
        <span className="keypad__door">Door {String(roomNumber).padStart(2, '0')}</span>
        <span className="keypad__state">
          <span className={`led led--${led}`} />
          {STATUS_WORD[status]}
        </span>
      </div>

      <label htmlFor={inputId} className="keypad__label">
        {door.prompt}
      </label>
      <div className="keypad__row">
        <input
          id={inputId}
          className="keypad__lcd"
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
        <button type="submit" className="btn btn--primary keypad__btn" disabled={status === 'checking'}>
          {status === 'checking' ? 'Checking…' : 'Unlock'}
        </button>
      </div>
      <p id={statusId} className="keypad__msg" role="status">
        {status === 'denied' && 'Access denied. That code doesn’t open this door.'}
        {status === 'error' && 'The lock isn’t responding. Is the server running?'}
      </p>
    </form>
  );
}
