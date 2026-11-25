import type { PlannedRoom, RoomDefinition } from './types';
import { loginLobby } from '../rooms/LoginLobby';
import { consoleCorridor } from '../rooms/ConsoleCorridor';

/** Rooms that are built, in play order. */
export const ROOMS: RoomDefinition[] = [loginLobby, consoleCorridor];

/** The full plan, including rooms that aren't built yet. */
export const ROOM_PLAN: PlannedRoom[] = [
  { number: 1, title: 'Login Lobby', skill: 'Reading the page in DevTools (Elements)' },
  { number: 2, title: 'Console Corridor', skill: 'Checking the console' },
  { number: 3, title: 'API Vault', skill: 'Network tab and API testing' },
  { number: 4, title: 'Storage Closet', skill: 'Security and authorization testing' },
  { number: 5, title: 'Checkout Gate', skill: 'Boundary values and client-side validation' },
  { number: 6, title: 'Dark Room', skill: 'Accessibility testing' },
  { number: 7, title: 'The Release Board', skill: 'Defect reporting' },
];

export const TOTAL_ROOMS = ROOM_PLAN.length;
