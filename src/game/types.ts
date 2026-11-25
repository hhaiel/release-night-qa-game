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
  /** One or two lines of story shown above the room. */
  briefing: string;
  hints: [string, string, string];
  debrief: Debrief;
  Component: ComponentType<RoomProps>;
}

/** A room that's planned but not built yet. Shown on the "coming soon" screen. */
export interface PlannedRoom {
  number: number;
  title: string;
  skill: string;
}
