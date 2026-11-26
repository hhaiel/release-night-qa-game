# Roadmap: building Release Night step by step

**What this is:** a browser escape-room game where every door is locked behind a bug. Each room shows one QA skill, and the debrief after each room explains the bug the way you'd report it on a real project. The game is the showcase. The QA work around it (test plan, Playwright suite, CI, defect log) is what makes it a portfolio piece.

**Total:** about 3–4 weeks part-time. Tick items off as you go.

```
Phase 0  Setup + Room 1 prototype     done
Phase 1  Game design on paper         1 day
Phase 2  Rooms 2–6                    5–7 days
Phase 3  Room 7 + polish              3–4 days
Phase 4  QA layer: tests + CI         4–5 days
Phase 5  Deploy + case-study README   1–2 days
```

---

## Phase 0: Setup + Room 1 prototype (done)
- [x] Vite + React + TypeScript project next to `orangehrm-qa-portfolio`
- [x] Answer-check API in `api/check.ts` (runs on Vercel; `vite.config.ts` runs it locally during `npm run dev`)
- [x] Answers stored only as SHA-256 hashes (`api/_lib/answers.ts`), so the GitHub source doesn't spoil them
- [x] Game shell: intro, HUD with game clock, room view, hints, door-unlock animation, debrief, "coming soon" screen
- [x] Progress saved in `localStorage` (refresh keeps your place; **Restart** clears it)
- [x] Room 1 (Login Lobby) playable end to end
- [x] `git init` and first commit
- [x] Create a **public** GitHub repo and push ([hhaiel/release-night-qa-game](https://github.com/hhaiel/release-night-qa-game))

**Done when:** you've played Room 1 yourself and it's on GitHub.

## Phase 1: Game design on paper (1 day)
- [ ] Read [docs/game-design.md](docs/game-design.md) and change anything you'd do differently
- [x] Draft Rooms 2–7: answer, 3 hints, debrief bug report (in the design doc, marked "Draft for review")
- [ ] Review the draft and swap any placeholder answers for your own
- [x] Draft scoring: points per room, hint cost, before-midnight bonus
- [ ] Approve or change the scoring
- [x] Draft rank thresholds ("Intern on Their First Day" → "Release Blocker")
- [x] Draft clock rules: half speed, pauses when the tab is hidden; after midnight you keep playing but lose the bonus

**Done when:** every room has an answer, 3 hints and a debrief written down.

## Phase 2: Rooms 2–6 (5–7 days)
Build one room at a time. For each: component in `src/rooms/`, add it to `ROOMS` in `src/game/rooms.ts`, add its answer hash with `npm run hash-answer -- <room-id> "<answer>"`, play it, then write its test cases.
- [x] Room 2 Console Corridor: page "works" but the console logs an error that contains the code
- [x] Shared door keypad for rooms that open with a code (`src/components/DoorKeypad.tsx`)
- [x] Room 3 API Vault: an endpoint returns `200 OK` with an error and the code hidden in the JSON body (`api/orders.ts`)
- [x] Room 4 Storage Closet: admin panel trusts an `sr_role=user` cookie; the server checks the cookie, so editing it in DevTools opens the door
- [x] Room 5 Checkout Gate: discount field blocks >100 in the browser only; the server accepts 101% and the store "pays you"
- [x] Room 6 Dark Room: exit button has no accessible name and near-invisible contrast; findable with Tab or the accessibility tree

**Done when:** you can play Rooms 1–6 start to finish.

## Phase 3: Room 7 + polish (3–4 days)
- [x] Room 7 The Release Board: write a bug report for one bug you found; scored by `POST /api/report` (rules in `api/_lib/report-rules.ts`)
- [x] Scoring and ranks on an ending screen (`src/game/score.ts`, `src/components/Ending.tsx`)
- [x] Clock runs at half speed (13 game minutes = 26 real minutes; `GAME_SPEED` in `src/lib/time.ts`) and stops when the release is blocked
- [ ] Pause the clock when the tab is closed (right now it keeps running from `startedAt`, so closing the tab still costs game time)
- [ ] Sound effects (off by default, with a mute toggle)
- [ ] Mobile layout check
- [ ] Social preview image and page title for sharing

**Done when:** a friend can play through without help and gets a rank at the end.

## Phase 4: QA layer (4–5 days)
- [x] `docs/test-plan.md`: scope, approach, entry/exit criteria, risks, results
- [x] `test-cases/`: 56 manual test cases in 4 files (same format as the OrangeHRM project), IDs matching the automated tests
- [x] Playwright UI suite that solves every room, plus a full no-hint walkthrough (7,500 points, Release Blocker)
- [x] API tests for `/api/check` and every room endpoint, including table-driven boundaries
- [x] axe accessibility checks on every screen; the Dark Room is asserted to fail with exactly `button-name` and `color-contrast`
- [x] GitHub Actions CI: typecheck, build, answer-leak check, Playwright on every push (`.github/workflows/ci.yml`)
- [x] `defects/defect-log.md`: 9 real bugs in the game (7 fixed and retested, 2 open)

**Done when:** CI is green and the defect log has real entries.

## Phase 5: Deploy + case-study README (1–2 days)
- [ ] Deploy to Vercel (import the GitHub repo; no config needed)
- [ ] Run the Playwright suite against the deployed URL once (`BASE_URL=<url> npm test`)
- [x] README written as a case study: the problem, the design, the bugs, how it's tested, what you learned
- [x] CI badge and screenshots in the README (`npm run screenshots` regenerates them)
- [ ] Live link in the README

**Done when:** the live URL is on your CV.

---

## Known issues
Moved to the [defect log](defects/defect-log.md) (DEF-001 to DEF-010).
