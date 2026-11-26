# Test cases: game shell and full playthrough

**Source of truth:** [docs/game-design.md](../docs/game-design.md) (no formal user stories; requirement references are to its sections).
**Automation:** each ID matches a Playwright test title in `tests/ui/game-shell.spec.ts` and `tests/ui/walkthrough.spec.ts`.
**Executed:** 2026-11-26, Chromium (Playwright), local dev server. Status reflects that run.

## Requirement gaps
- **Clock pause:** the design says the clock pauses while the tab is hidden; it doesn't yet (open item on the roadmap). Not tested; see DEF-002.
- **Progress tampering:** the design doesn't say whether editing saved progress in `localStorage` should be prevented. Observed: it lets a player skip rooms. Logged as DEF-001 (Needs confirmation).
- **Reduced motion:** the design doesn't specify reduced-motion behavior; the game shortens the door animation to 0.7 s and stops looping animations. Automation runs in this mode.

## Test cases

| Test Case ID | Feature Name | Test Case/Scenario | Pre-requisite | Test Steps | Test Data | Expected Results | Browsers | Status | Actual Results |
|---|---|---|---|---|---|---|---|---|---|
| TC-GAME-001 | Intro and start | Verify the intro shows the story and Start opens Room 1 with a running countdown (Core loop) | No saved progress | 1. Open the game.<br>2. Read the intro.<br>3. Click **Start the shift**. | — | Intro shows "Release Night". After Start, Room 1 "Login Lobby" opens, the top bar shows T−13:00 counting down and Hints 0. | Chromium | Pass | As expected |
| TC-GAME-002 | Saved progress | Verify progress survives a page reload (Progress) | Game open at Room 3, Rooms 1–2 solved | 1. Note the current room.<br>2. Reload the page. | — | The same room (API Vault) is shown after reload. | Chromium | Pass | As expected |
| TC-GAME-003 | Restart | Verify Restart returns to the intro and clears progress (Progress) | Game open at Room 4 | 1. Click **Restart** in the top bar.<br>2. Confirm the dialog.<br>3. Reload the page. | — | The intro is shown, and still shown after reload (no saved progress). | Chromium | Pass | As expected |
| TC-GAME-004 | Hints | Verify hints decrypt one at a time, are counted, and run out after 3 (Scoring: hints) | Game open at Room 1, no hints used | 1. Check the hint button's label.<br>2. Click **Decrypt hint 1**.<br>3. Click it twice more. | — | Button reads "Decrypt hint 1 −100 pts". After each click one more hint opens; the top bar shows Hints 1, then 3. After 3 hints the button is gone. | Chromium | Pass | As expected |
| TC-GAME-005 | Door keypad | Verify a wrong door code is rejected and the room stays locked (Answer checking) | Game open at Room 2 | 1. Type a wrong code in the door lock.<br>2. Click **Unlock**. | Code: TRC-0000-00 | "Access denied. That code doesn't open this door." Room 2 is still shown. | Chromium | Pass | As expected |
| TC-GAME-006 | Door keypad | Verify door codes ignore case, spaces and dashes (Answer checking) | Game open at Room 2 | 1. Type the trace ID in lowercase with spaces.<br>2. Click **Unlock**. | Code: " trc 7q4m 2b " | Door opens and the Room 2 debrief is shown. | Chromium | Pass | As expected |
| TC-GAME-007 | Restart | Verify Restart clears the Room 4 admin cookie so a replay starts locked (Room 4 build notes) | Game open at Room 4; sr_role cookie set to admin | 1. Click **Restart** and confirm.<br>2. Check the site's cookies in DevTools. | Cookie: sr_role=admin | No sr_role cookie remains. | Chromium | Pass | As expected |
| TC-GAME-010 | Full playthrough | Verify a full game with no hints ends as Release Blocker with 7,500 points (Rooms 1–7, Scoring) | No saved progress | 1. Start the shift.<br>2. Solve Rooms 1–6 the intended way (see TC-ROOMS).<br>3. File a complete bug report in Room 7.<br>4. Click **Pull the release**. | Answers per design doc; report per TC-R7-002 | Each room shows its debrief. Ending shows rank "Release Blocker", "Release blocked before midnight" and a total of 7,500 points (6 × 1000 + 100 × 10 + 500). The top bar shows BLOCKED. | Chromium | Pass | As expected |

**8 test cases.** Cover: core loop, progress, restart, hints, door keypad, scoring and ranks. Clock pause while hidden is not covered (not built; DEF-002).
