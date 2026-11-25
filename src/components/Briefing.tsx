interface Props {
  text: string;
  roomNumber: number;
}

/** The room's story line, shown as a chat message from the release manager. */
export function Briefing({ text, roomNumber }: Props) {
  // Each room's message arrives a couple of minutes later in the story.
  const minute = String(47 + (roomNumber - 1) * 2).padStart(2, '0');
  return (
    <div className="chat">
      <div className="chat__avatar" aria-hidden="true">
        PR
      </div>
      <div className="chat__bubble">
        <p className="chat__meta">
          <span className="chat__name">Priya · Release Manager</span>
          <span className="chat__time">23:{minute}</span>
        </p>
        <p className="chat__text">{text}</p>
      </div>
    </div>
  );
}
