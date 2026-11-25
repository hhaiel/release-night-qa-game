# Release Night: a QA escape room

> It's 23:47 and v2.3 of the ShopRight store ships at midnight. You're the last QA still online. Every door is locked behind a bug. Find the bug, open the door, block the release.

A browser game where each room teaches one real QA skill (DevTools, the console, API testing, authorization, boundary values, accessibility, defect reporting). After each room, a debrief explains the bug the way it would show up on a real project and how you'd report it.

**Status:** prototype. Room 1 of 7 is playable. See [ROADMAP.md](ROADMAP.md).

<!-- Live link, CI badge and screenshots go here in Phase 5. The rest of this README becomes the case study. -->

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
- Planned: Playwright (UI + API), axe accessibility checks, GitHub Actions CI

## Project layout
```
api/                 serverless endpoints (POST /api/check)
  _lib/answers.ts    hashed answers and per-room normalizing
docs/game-design.md  story, rooms, answers, API contract (spoilers)
scripts/             helper scripts (hash-answer)
src/
  components/        game shell: intro, HUD, hints, door, debrief
  game/              room registry, progress store, types
  rooms/             one file per room: component + hints + debrief
```
