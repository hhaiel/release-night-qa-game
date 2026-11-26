# Release Night: a QA escape room

> It's 23:47 and v2.3 of the ShopRight store ships at midnight. You're the last QA still online. Every door is locked behind a bug. Find the bug, open the door, block the release.

A browser game where each room teaches one real QA skill (DevTools, the console, API testing, authorization, boundary values, accessibility, defect reporting). After each room, a debrief explains the bug the way it would show up on a real project and how you'd report it.

[![CI](https://github.com/hhaiel/release-night-qa-game/actions/workflows/ci.yml/badge.svg)](https://github.com/hhaiel/release-night-qa-game/actions/workflows/ci.yml)

**Status:** all 7 rooms playable, 76 automated tests passing in CI. Next: deploy and the case-study write-up. See [ROADMAP.md](ROADMAP.md).

<!-- Live link and screenshots go here in Phase 5. The rest of this README becomes the case study. -->

## Run it locally
```bash
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173). Open your browser's DevTools; you'll need them.

## Stack
- Vite + React + TypeScript
- Serverless answer checking in `api/` (Vercel Functions; run locally by `vite.config.ts`)
- Progress saved in `localStorage`
- Playwright (UI, API), axe-core accessibility checks, GitHub Actions CI

## Testing
| | |
|---|---|
| Test plan | [docs/test-plan.md](docs/test-plan.md) |
| Manual test cases | [test-cases/](test-cases/) (56 cases) |
| Automated tests | 76 Playwright tests: UI, API, accessibility ([tests/](tests/)) |
| Defect log | [defects/defect-log.md](defects/defect-log.md) (9 real bugs in the game, 7 fixed) |

```bash
npx playwright install chromium   # first time only
npm test                          # everything (starts its own server)
npm run test:ui                   # or :api, :a11y
npm run test:report               # open the HTML report
```

## Project layout
```
.github/workflows/   CI: typecheck, build, Playwright
api/                 serverless endpoints (answer check + the room APIs)
  _lib/              hashed answers, report scoring rules, cookie helper
defects/             defect log
docs/                game design (spoilers) and test plan
scripts/             helper scripts (hash-answer)
src/
  components/        game shell: intro, HUD, hints, door, debrief
  game/              room registry, progress store, types
  rooms/             one file per room: component + hints + debrief
test-cases/          manual test cases (IDs match the automated tests)
tests/
  support/           Page Object and fixtures
  ui/ api/ a11y/     Playwright specs
```
