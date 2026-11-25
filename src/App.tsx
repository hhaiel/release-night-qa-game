import { useCallback, useEffect, useState } from 'react';
import { useProgress } from './game/progress';
import { ROOMS, ROOM_PLAN, TOTAL_ROOMS } from './game/rooms';
import { Intro } from './components/Intro';
import { Hud } from './components/Hud';
import { HintPanel } from './components/HintPanel';
import { DoorUnlock } from './components/DoorUnlock';
import { Debrief } from './components/Debrief';
import { ComingSoon } from './components/ComingSoon';

export default function App() {
  const { progress, start, reset, enterRoom, takeHint, solveRoom, nextRoom } = useProgress();
  const [unlocking, setUnlocking] = useState(false);

  const room = ROOMS[progress.currentRoom];
  const roomProgress = room ? (progress.rooms[room.id] ?? { hintsUsed: 0 }) : undefined;

  useEffect(() => {
    if (progress.startedAt && room) enterRoom(room.id);
  }, [progress.startedAt, room, enterRoom]);

  const handleSolved = useCallback(() => {
    if (!room) return;
    solveRoom(room.id);
    setUnlocking(true);
  }, [room, solveRoom]);

  const handleUnlocked = useCallback(() => setUnlocking(false), []);

  if (!progress.startedAt) {
    return (
      <main className="shell shell--center">
        <Intro onStart={start} />
      </main>
    );
  }

  let content;
  if (!room || !roomProgress) {
    content = <ComingSoon plan={ROOM_PLAN} builtCount={ROOMS.length} onReset={reset} />;
  } else if (unlocking) {
    content = <DoorUnlock onDone={handleUnlocked} />;
  } else if (roomProgress.solvedAt) {
    content = <Debrief room={room} progress={roomProgress} onContinue={nextRoom} />;
  } else {
    const RoomComponent = room.Component;
    content = (
      <div className="room">
        <div className="room__header">
          <p className="eyebrow">
            Room {room.number} · {room.title}
          </p>
          <p className="room__briefing">{room.briefing}</p>
        </div>
        <div className="room__layout">
          <div className="room__stage">
            <RoomComponent onSolved={handleSolved} />
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
        roomNumber={progress.currentRoom + 1}
        totalRooms={TOTAL_ROOMS}
        onReset={reset}
      />
      <main className="shell">{content}</main>
    </>
  );
}
