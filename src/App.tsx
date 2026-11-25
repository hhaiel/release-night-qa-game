import { useCallback, useEffect, useState } from 'react';
import { useProgress } from './game/progress';
import { ROOMS, ROOM_PLAN } from './game/rooms';
import { Intro } from './components/Intro';
import { Hud, type DoorState } from './components/Hud';
import { HintPanel } from './components/HintPanel';
import { DoorUnlock } from './components/DoorUnlock';
import { Debrief } from './components/Debrief';
import { BrowserFrame } from './components/BrowserFrame';
import { Briefing } from './components/Briefing';
import { DoorKeypad } from './components/DoorKeypad';
import { Ending } from './components/Ending';
import { FINAL_ROOM_ID } from './game/score';
import type { SolveResult } from './game/types';

export default function App() {
  const { progress, start, reset, enterRoom, takeHint, solveRoom, nextRoom } = useProgress();
  const [unlocking, setUnlocking] = useState(false);

  const room = ROOMS[progress.currentRoom];
  const roomProgress = room ? (progress.rooms[room.id] ?? { hintsUsed: 0 }) : undefined;

  useEffect(() => {
    if (progress.startedAt && room) enterRoom(room.id);
  }, [progress.startedAt, room, enterRoom]);

  const handleSolved = useCallback(
    (result?: SolveResult) => {
      if (!room) return;
      solveRoom(room.id, result?.reportScore);
      setUnlocking(true);
    },
    [room, solveRoom],
  );

  const handleUnlocked = useCallback(() => setUnlocking(false), []);

  if (!progress.startedAt) {
    return (
      <main className="shell shell--intro">
        <Intro onStart={start} />
      </main>
    );
  }

  const doors = ROOM_PLAN.map((planned, i) => {
    const built = ROOMS[i];
    const solved = built ? Boolean(progress.rooms[built.id]?.solvedAt) : false;
    const state: DoorState =
      solved || i < progress.currentRoom ? 'cleared' : i === progress.currentRoom ? 'current' : 'locked';
    return { number: planned.number, title: planned.title, state };
  });
  const hintsUsed = Object.values(progress.rooms).reduce((sum, r) => sum + r.hintsUsed, 0);

  let content;
  const isFinal = room?.id === FINAL_ROOM_ID;
  if (!room || !roomProgress) {
    // Past the last room (e.g. an older save): show the ending.
    content = <Ending rooms={ROOMS} progress={progress} onPlayAgain={reset} />;
  } else if (unlocking) {
    content = (
      <DoorUnlock
        roomNumber={room.number}
        label={isFinal ? 'Release blocked' : undefined}
        onDone={handleUnlocked}
      />
    );
  } else if (roomProgress.solvedAt) {
    content = isFinal ? (
      <Ending rooms={ROOMS} progress={progress} onPlayAgain={reset} />
    ) : (
      <Debrief room={room} progress={roomProgress} onContinue={nextRoom} />
    );
  } else {
    const RoomComponent = room.Component;
    content = (
      <div className="room">
        <div className="room__header">
          <span className="room__number" aria-hidden="true">
            {String(room.number).padStart(2, '0')}
          </span>
          <div className="room__heading">
            <p className="eyebrow">Room {room.number} of {ROOM_PLAN.length}</p>
            <h1 className="room__title">{room.title}</h1>
            <span className="chip chip--skill">{room.skill}</span>
          </div>
        </div>
        <Briefing text={room.briefing} roomNumber={room.number} />
        <div className="room__layout">
          <div className="room__main">
            <BrowserFrame url={room.url}>
              <RoomComponent onSolved={handleSolved} />
            </BrowserFrame>
            {room.door && <DoorKeypad key={room.id} roomId={room.id} door={room.door} onSolved={handleSolved} />}
          </div>
          <HintPanel hints={room.hints} used={roomProgress.hintsUsed} onTakeHint={() => takeHint(room.id)} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Hud
        startedAt={progress.startedAt}
        endedAt={progress.rooms[FINAL_ROOM_ID]?.solvedAt}
        doors={doors}
        hintsUsed={hintsUsed}
        onReset={reset}
      />
      <main className="shell">{content}</main>
    </>
  );
}
