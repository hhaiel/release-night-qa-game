# Test plan: Release Night

## 1. What's being tested
**Release Night**, a browser escape-room game (React + TypeScript, serverless API). Each of 7 rooms contains a **deliberate** bug the player has to find. Testing has two jobs:

1. **The game works:** navigation, saved progress, hints, door codes, scoring, the ending, and the API behind it.
2. **The deliberate bugs behave exactly as designed:** each room's bug must be present and findable, or the puzzle breaks. An accidental "fix" counts as a regression.

Source of truth: [game-design.md](game-design.md) (rooms, answers, API contract, scoring). There are no formal user stories; test cases trace to its sections.

## 2. Scope
| In scope | Out of scope |
|---|---|
| Game shell: intro, top bar, hints, door keypad, debriefs, restart, saved progress | Load and performance testing |
| All 7 rooms, solved the way a player would | Browsers other than Chromium (manual spot-check only) |
| API: `/api/check`, `/api/orders`, `/api/session`, `/api/admin`, `/api/checkout`, `/api/report` | Security hardening of the game itself (rate limiting, tamper-proof progress) |
| Scoring, ranks, before-midnight bonus | Sound (not built) |
| Accessibility: WCAG 2.1 AA with axe on every screen; keyboard path in Room 6 | Full manual screen reader audit |

## 3. Approach
| Level | How | Where |
|---|---|---|
| **UI (end to end)** | Playwright, Page Object Model. Each room is solved through the same tools a player uses: DOM (comments, attributes), console messages, network responses, cookies, keyboard. | `tests/ui/` |
| **Full walkthrough** | One test plays the whole game with no hints and checks the exact final score (7,500) and rank. | `tests/ui/walkthrough.spec.ts` |
| **API** | Playwright `request` (plain HTTP, no browser). Table-driven boundary tests, e.g. checkout discounts −1, 0, 1, 12.5, 99, 100, 101, 150, "50", null. | `tests/api/` |
| **Accessibility** | axe-core, WCAG 2.1 A/AA tags, on every screen. Room 6 must fail with exactly `button-name` and `color-contrast`. | `tests/a11y/` |
| **Manual** | Exploratory play-testing while building each room, plus a final play-through on desktop and mobile widths. | Findings in the defect log |

**Techniques used:** boundary value analysis (discount, answer length, report fields), equivalence partitioning (cookie roles, answer formats), negative testing (malformed JSON, wrong methods, unknown IDs), state transition (intro → room → door → debrief → next room → ending), and regression pinning for the deliberate bugs.

**Conventions:** test titles start with the manual test case ID (e.g. `TC-R5-003 …`). Locators use `getByRole` / `getByLabel` / `getByText` and live in the page object. No fixed waits (`waitForTimeout`), only assertions that retry until they pass. Tests run with the browser's reduced-motion setting, which the game supports.

## 4. Test cases
| File | Area | Cases | Automated tests |
|---|---|---|---|
| [TC-GAME.md](../test-cases/TC-GAME.md) | Game shell, full playthrough | 8 | 8 |
| [TC-ROOMS.md](../test-cases/TC-ROOMS.md) | Rooms 1–7 | 19 | 19 |
| [TC-API.md](../test-cases/TC-API.md) | API contract and room endpoints | 20 | 40 (data rows) |
| [TC-A11Y.md](../test-cases/TC-A11Y.md) | Accessibility | 9 | 9 |
| **Total** | | **56** | **76** |

## 5. Environment
- Chromium (Playwright 1.65), Windows 11 locally; Ubuntu in GitHub Actions.
- The game runs on Vite's dev server; `vite.config.ts` runs the `/api` functions the same way Vercel does.
- Playwright starts its own server on port 4174, so it doesn't clash with a dev server on 5173.
- Commands: `npm test`, `npm run test:ui`, `npm run test:api`, `npm run test:a11y`, `npm run test:report`.

## 6. Entry and exit criteria
**Entry:** the game builds (`npm run build`), and the rooms under test are in the design doc.
**Exit:**
- All automated tests pass in CI on `main`.
- No open Critical or High defects.
- Every room has at least one test proving its bug is present and one proving its answer opens the door.
- Every open defect is in the [defect log](../defects/defect-log.md) with a status.

## 7. Risks
| Risk | Mitigation |
|---|---|
| A deliberate bug gets "fixed" by accident, breaking the puzzle | API and UI tests assert the exact buggy behavior (e.g. 101% → refund) |
| Answers leak into the client bundle | Answers are checked on the server as hashes; bundle checked with `grep` after build for code rooms |
| Timing-dependent UI (door animation, API delay) makes tests flaky | Reduced motion, assertions that retry until they pass, 10 s allowance for the door; suite run 4× in a row with no failures |
| axe misses contrast on gradients | Known limitation; Room 6's notice has a solid background (DEF-009) |
| Only Chromium is automated | Manual spot-check in Firefox before release |

## 8. Results (2026-11-26)
- **76 / 76 automated tests pass** (about 1.2 minutes locally), stable over 4 consecutive runs.
- **10 defects** logged: 8 fixed and retested, 2 open (1 needs confirmation). The first automated run found 4 of them (3 accessibility, 1 in the ending screen); one more was in the test code itself (DEF-010).
- All 7 deliberate bugs confirmed present and solvable.
