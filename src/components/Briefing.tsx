interface Props {
  text: string;
  roomNumber: number;
}

/** The room's story line, shown as a chat message from the release manager in #release-v2-3. */
export function Briefing({ text, roomNumber }: Props) {
  // Each room's message arrives a couple of minutes later in the story.
  const minute = String(47 + (roomNumber - 1) * 2).padStart(2, '0');
  return (
    <div className="msg">
      <div className="msg__avatar" aria-hidden="true">
        PR
      </div>
      <div className="msg__body">
        <p className="msg__meta">
          <span className="msg__name">Priya</span>
          <span className="msg__role">Release Manager</span>
          <span className="msg__time">23:{minute}</span>
          <span className="msg__channel">#release-v2-3</span>
        </p>
        <p className="msg__text">{text}</p>
      </div>
    </div>
  );
}
