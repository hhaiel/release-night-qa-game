import { useState, type CSSProperties, type PointerEvent } from 'react';
import type { RoomDefinition } from '../game/types';

/*
 * The bug in this room: the only working exit is a <button> with an icon and no accessible name
 * (no text, no aria-label), nearly invisible colors (#151515 on #0d0d0d) and its focus outline
 * removed. Screen readers announce it as just "button".
 *
 * Pressing it puts the exit code into a visually hidden aria-live region. Screen readers read it
 * aloud; sighted players have to find it in DevTools (Elements or the Accessibility tree).
 * So clicking the button by luck isn't enough on its own.
 *
 * THIS ROOM MUST FAIL AXE ON PURPOSE (button-name, color-contrast). Don't "fix" it.
 * Opens with the keypad under the page. This component never calls onSolved.
 */

/** "Emergency exit code: LUMEN-6", built from character codes so a search of the JS bundle doesn't find it. */
function exitMessage(): string {
  return [69, 109, 101, 114, 103, 101, 110, 99, 121, 32, 101, 120, 105, 116, 32, 99, 111, 100, 101, 58, 32, 76, 85, 77,
    69, 78, 45, 54]
    .map((c) => String.fromCharCode(c))
    .join('');
}

function DarkRoom() {
  const [announcement, setAnnouncement] = useState('');
  const [signClicked, setSignClicked] = useState(false);
  const [light, setLight] = useState({ x: 50, y: 40 });

  function moveFlashlight(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setLight({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

  return (
    <div
      className="fake-app dark-room"
      onPointerMove={moveFlashlight}
      style={{ '--lx': `${light.x}%`, '--ly': `${light.y}%` } as CSSProperties}
    >
      <div className="dark-room__flashlight" aria-hidden="true" />

      {/* Low contrast on purpose (part of the bug): about 1.7:1 */}
      <p className="dark-room__notice">Power failure on floor 3. Emergency lighting offline.</p>

      {/* The decoy: a glowing sign that does nothing. */}
      <div
        className="dark-room__sign"
        role="img"
        aria-label="Exit sign"
        onClick={() => setSignClicked(true)}
      >
        <span>EXIT</span>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="9" cy="5" r="2" fill="currentColor" />
          <path d="M9 8l-3 5h4l1 6M10 13l4-2 3 3M17 12h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      {signClicked && <p className="dark-room__sign-note">It&rsquo;s just a sign. Signs don&rsquo;t open doors.</p>}

      {/* Office furniture in the dark, purely decorative. */}
      <svg className="dark-room__furniture" viewBox="0 0 600 260" aria-hidden="true" preserveAspectRatio="xMidYMax meet">
        <rect x="40" y="150" width="170" height="12" rx="3" />
        <rect x="55" y="162" width="8" height="70" />
        <rect x="187" y="162" width="8" height="70" />
        <rect x="95" y="100" width="70" height="48" rx="4" />
        <rect x="380" y="150" width="170" height="12" rx="3" />
        <rect x="395" y="162" width="8" height="70" />
        <rect x="527" y="162" width="8" height="70" />
        <rect x="430" y="100" width="70" height="48" rx="4" />
        <circle cx="300" cy="200" r="26" />
        <rect x="296" y="200" width="8" height="40" />
      </svg>

      {/* THE BUG: the real exit. No accessible name, no contrast, no focus indicator. */}
      <button className="dark-room__exit" onClick={() => setAnnouncement(exitMessage())}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M14 3h5v18h-5M3 12h11M10 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Read aloud by screen readers; invisible on screen. */}
      <div className="visually-hidden" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}

export const darkRoom: RoomDefinition = {
  id: 'dark-room',
  number: 6,
  title: 'Dark Room',
  skill: 'Accessibility testing',
  url: 'staging.shopright.app/floor-3',
  briefing:
    'Power’s out on the third floor. The exit is somewhere on this screen. Your eyes won’t help you here.',
  hints: [
    'Not everyone uses a mouse or can see the screen. How would they find their way out?',
    'Click inside the dark page, then press Tab. When focus seems to vanish, check DevTools to see which element has it (Elements, or document.activeElement in the Console).',
    'Press Enter on that unnamed button. Then look in Elements (or the Accessibility tree) for an element with aria-live. Its text is the code.',
  ],
  door: {
    prompt: 'Emergency exit code',
    placeholder: 'XXXXX-0',
  },
  debrief: {
    bug: 'The only exit has no name, no contrast and no visible focus',
    whatWasWrong:
      'The working exit was a button with just an icon: no text and no aria-label, so screen readers announced it as "button". Its colors were almost the same as the background (about 1.1:1), and its focus outline was removed, so keyboard users couldn’t see when they reached it. The big glowing EXIT sign was only a picture.',
    whyItMatters:
      'Keyboard and screen reader users can’t find or understand the control, so they’re stuck. This breaks WCAG 1.4.3 (contrast), 2.4.7 (visible focus) and 4.1.2 (name, role, value). In many countries accessibility is a legal requirement, and lawsuits over it are common.',
    howYouFoundIt:
      'You stopped relying on your eyes. You moved through the page with Tab, noticed focus land on something invisible, and used DevTools to find the unnamed button and the hidden live region.',
    report: {
      title: 'Floor 3 page: exit button has no accessible name, insufficient contrast and no focus indicator',
      severity: 'High',
      category: 'UI/Display',
      steps: [
        'Open the floor 3 page.',
        'Press Tab until focus reaches the exit button (focus seems to disappear).',
        'Check the button in DevTools > Accessibility, or with a screen reader.',
        'Run axe or Lighthouse on the page.',
      ],
      expected:
        'The button has a name ("Exit", as text or aria-label), contrast of at least 3:1 for the icon, and a visible focus outline.',
      actual:
        'The button is announced as "button" with no name, its contrast is about 1.1:1, and focus is invisible. axe reports button-name and color-contrast violations.',
    },
    testerTip:
      'Do one pass of every page with only the keyboard (Tab, Shift+Tab, Enter, Space, Esc), and run axe or Lighthouse. Both take five minutes and find bugs that mouse testing never will.',
  },
  Component: DarkRoom,
};
