import type { ComponentType } from 'react';

export interface RoomProps {
  /** Call this once the player has found the bug and opened the door. */
  onSolved: () => void;
}

export interface BugReport {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  steps: string[];
  expected: string;
  actual: string;
}

export interface Debrief {
  bug: string;
  whatWasWrong: string;
  whyItMatters: string;
  howYouFoundIt: string;
  report: BugReport;
  testerTip: string;
}

export interface RoomDefinition {
  id: string;
  number: number;
  title: string;
  skill: string;
  /** Fake address shown in the browser frame around the room, e.g. staging.shopright.app/login */
  url: string;
  /** One or two lines of story, shown as a chat message from the release manager. */
  briefing: string;
  hints: [string, string, string];
  debrief: Debrief;
  Component: ComponentType<RoomProps>;
  /**
   * A keypad under the room where the player types the code they found.
   * Leave it out when the room itself is the door (Room 1's login form).
   */
  door?: DoorConfig;
}

export interface DoorConfig {
  /** What the keypad asks for, e.g. "Trace ID of the failure". */
  prompt: string;
  /** Example of the format, shown greyed out in the input. */
  placeholder: string;
}

/** A room that's planned but not built yet. Shown on the "coming soon" screen. */
export interface PlannedRoom {
  number: number;
  title: string;
  skill: string;
}
