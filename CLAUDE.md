# CLAUDE.md: project conventions

QA portfolio project: **Release Night**, an escape-room game where every door is locked behind a bug. Sibling of `../orangehrm-qa-portfolio`; the QA docs (test cases, defect log) use the same formats as that project.

## Context
- The learner is new to coding: explain new patterns briefly when introducing them.
- `docs/game-design.md` is the source of truth for rooms, answers and the API contract. Update it when a room changes.
- `ROADMAP.md` is the checklist. Tick items when they're done.

## Rooms
- One file per room in `src/rooms/`, exporting a `RoomDefinition` (component, briefing, 3 hints, debrief). Register it in `ROOMS` in `src/game/rooms.ts`.
- Rooms that open with a code set `door: { prompt, placeholder }`; the app shows the shared `DoorKeypad` under the room. Rooms that are their own door (Room 1's login) leave `door` out and call `onSolved` themselves.
- If a room's code has to live in client code, build it so a search of the built bundle doesn't find it, and keep it out of the debrief text. Check with `grep` on `dist/assets/*.js` after `npm run build`.
- Room ids are kebab-case (`login-lobby`). The same id is used in the API and in `localStorage`.
- Answers are checked on the server. Store only hashes in `api/_lib/answers.ts` (`npm run hash-answer -- <room-id> "<answer>"`). Never put a room's answer in client code unless finding it in the page *is* the puzzle (Room 1).
- Rooms contain deliberate bugs. Don't "fix" them. Bugs in the game itself go in the defect log.
- The fake ShopRight app inside a room uses the light `.fake-app` styles; the game frame is dark.
- Room 7 (`release-board`) is the last room: it calls `onSolved({ reportScore })`, and the app shows the ending screen instead of a debrief. Scoring lives in `src/game/score.ts`.

## API
- Each file in `api/` exports one function per HTTP method taking a web `Request` and returning a `Response` (Vercel Functions format). `vite.config.ts` runs these during `npm run dev`. Files in `api/_lib/` are helpers, not endpoints.
- Relative imports in `api/` use the `.js` extension (`./_lib/answers.js`), which Vercel's ESM build needs.

## Tests (Phase 4)
- Playwright + TypeScript. Prefer `getByRole` / `getByLabel` / `getByText`. No `waitForTimeout`. Web-first assertions.
- Test titles start with the manual test case ID.
- axe runs on every room except the Dark Room, which must fail axe on purpose.

## Formats (same as OrangeHRM; use the skills)
- **Test cases** (`test-case-writer`): `Test Case ID | Feature Name | Test Case/Scenario | Pre-requisite | Test Steps | Test Data | Expected Results | Browsers | Status | Actual Results`
- **Defects** (`bug-hunter`): `Defect ID | Defect Title | Defect Description | Date Reported | Feature | Severity | Status | Category | Notes`
