# Game design

> **Spoilers.** This file describes every room's bug. That's fine for a portfolio repo (the Playwright suite will be a full walkthrough anyway), but don't send it to playtesters.

## Story
It's 23:47. Version 2.3 of the ShopRight store app ships at midnight. Everyone else has logged off and you're the only QA still online. Each room is a screen of the broken build, and every door is locked behind a bug. Find the bug, get the code, open the door. Get through all the rooms and you block the release in time.

## Core loop
1. **Briefing**: one or two lines of story above the room.
2. **Room**: a screen of the fake ShopRight app (light, plain, "corporate") inside the dark game frame.
3. **Find the bug** using real tester tools: DevTools Elements, Console, Network, Application (cookies/storage), Tab key, accessibility tree.
4. **Open the door**: submit the answer. The server checks it (`POST /api/check`).
5. **Door unlock** animation.
6. **Debrief**: what was wrong, why it matters, how you found it, a sample bug report, and a tester tip.

## Rooms
| # | Room | The bug | How the player opens the door | Skill |
|---|---|---|---|---|
| 1 | Login Lobby | Test account left in an HTML comment | Sign in with the leaked account | DevTools Elements (not View Source: the comment is added after load) |
| 2 | Console Corridor | Page looks fine; the console logs an error that contains the code | Enter the code from the console | Console |
| 3 | API Vault | API returns `200 OK` with `{ "error": ... }` and the code in the body | Enter the code from the response body | Network tab, API testing |
| 4 | Storage Closet | Admin panel trusts a `role=user` cookie | Change the cookie to `admin` and reload | Authorization testing |
| 5 | Checkout Gate | Discount limit only enforced in the browser; server accepts 101% | Send a discount over 100 (edit the input's `max`, or resend the request) | Boundary values, client-side validation |
| 6 | Dark Room | Exit button has no accessible name and no contrast | Find it with Tab or the accessibility tree and press it | Accessibility |
| 7 | The Release Board | (Final boss) | Write a bug report for a bug you found; scored on required fields | Defect reporting |

### Room 1: Login Lobby (built)
- **Briefing:** your QA account was deleted in this afternoon's "cleanup". Find another way in.
- **Bug:** `<!-- TODO(dev): remove before release!! temp QA login for staging: qa_temp / Midnight#23 -->` inside the login form.
- **Answer:** `qa_temp` / `Midnight#23`. The username ignores case and surrounding spaces; the password is exact.
- **Hints:** (1) the page may say more than it shows, (2) right-click › Inspect, (3) look for a green comment inside the `<form>`.
- **Debrief report severity:** Critical (Security).

### Rooms 2–7
To be written in Phase 1. For each room, fill in the same fields as Room 1: briefing, bug, exact answer, 3 hints, debrief report.

## Answer checking
- Answers are checked on the server so they can't be read from the game's JavaScript.
- `api/_lib/answers.ts` stores only `sha256("<room-id>:<normalized answer>")`. Each room has its own `normalize` function (e.g. lowercase the username).
- Add a hash with `npm run hash-answer -- <room-id> "<normalized answer>"`.
- Room 1 is a special case: the answer is meant to be found in the page, so it's in the client code on purpose.

### `POST /api/check`
| Case | Status | Body |
|---|---|---|
| Right answer | 200 | `{ "correct": true }` |
| Wrong answer | 200 | `{ "correct": false }` |
| Body isn't JSON | 400 | `{ "error": "Body must be valid JSON" }` |
| `room` or `answer` missing or not a string | 400 | `{ "error": "..." }` |
| `answer` over 200 characters | 400 | `{ "error": "..." }` |
| Unknown room | 404 | `{ "error": "Unknown room" }` |
| Any method except POST | 405 | `{ "error": "Method not allowed" }` |

A wrong answer is a normal result, not an error, so it returns 200. (Room 3's API is the deliberately broken one.)

## Scoring (draft, decide in Phase 1)
- Hints cost 100 points each. Already shown in the game.
- Ideas: 1000 points per room, minus hints, plus a time bonus; ranks from "Junior Tester" to "Release Blocker".

## Progress
Saved in `localStorage` under `release-night:progress:v1`: start time, current room, and per room the time entered, time solved and hints used.
