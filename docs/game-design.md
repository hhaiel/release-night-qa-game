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
| 4 | Storage Closet | Admin panel trusts an `sr_role=user` cookie | Change the cookie to `admin`, retry, read the override code | Authorization testing |
| 5 | Checkout Gate | Discount limit only enforced in the browser; server accepts 101% | Send a discount over 100 (edit the input's `max`, or resend the request), read the refund reference | Boundary values, client-side validation |
| 6 | Dark Room | Exit button has no accessible name and no contrast | Find it with Tab or the accessibility tree, press it, read the hidden live-region code | Accessibility |
| 7 | The Release Board | (Final boss) | Write a bug report for a bug you found; scored on required fields | Defect reporting |

### Room 1: Login Lobby (built)
- **Briefing:** your QA account was deleted in this afternoon's "cleanup". Find another way in.
- **Bug:** `<!-- TODO(dev): remove before release!! temp QA login for staging: qa_temp / Midnight#23 -->` inside the login form.
- **Answer:** `qa_temp` / `Midnight#23`. The username ignores case and surrounding spaces; the password is exact.
- **Hints:** (1) the page may say more than it shows, (2) right-click › Inspect, (3) look for a green comment inside the `<form>`.
- **Debrief report severity:** Critical (Security).

> **Draft for review.** Rooms 2–7 below are a first draft. Change anything you'd do differently before it gets built. Answers marked *(placeholder)* can be swapped for your own.

### Room 2: Console Corridor (built)
- **Room id:** `console-corridor`
- **Screen:** ShopRight product page for a "Midnight Hoodie". **Add to cart** shows a green "Added to cart!" toast, but the cart count in the header stays at 0.
- **Briefing:** "QA signed off on Add to Cart this morning. It says it works. Does it?"
- **Bug:** the click handler shows the success toast *before* the cart update runs, and the update then throws. The console shows:
  - `Uncaught TypeError: Cannot read properties of undefined (reading 'qty')`
  - `[cart] sync failed. Report this trace ID to the on-call dev: TRC-7Q4M-2B`
- **Door:** a keypad asking for "the trace ID of the failure the release lead needs".
- **Answer:** `TRC-7Q4M-2B` *(placeholder)*. Ignores case, spaces and dashes.
- **Hints:**
  1. The screen says success. Is the screen the only thing you can trust?
  2. Press F12 and open the Console tab, then click Add to cart again.
  3. Look for a red error and the `[cart]` line right after it. The trace ID starts with `TRC-`.
- **Debrief:**
  - *What was wrong:* the UI reported success while the cart update failed in the background.
  - *Why it matters:* customers think items are in their cart and lose them at checkout. Nobody notices in a demo because the toast looks right.
  - *Report:* "Product page: Add to cart shows success but the item isn't added (TypeError in console)". Severity **High**, Category **Functional**. Steps: open the product page, open the Console, click Add to cart, check the cart count. Expected: count goes to 1 and no errors. Actual: toast shows, count stays 0, TypeError logged.
  - *Tester tip:* keep the console open during every test session. Paste the full error text and the trace ID into the bug report; it saves the developer an hour.
- **Build notes:** the code is meant to be found in the client, like Room 1. It's built from character codes, so searching the JS bundle for `TRC-` or `7Q4M` finds nothing (checked after build). The TypeError is a real one (the cart is keyed by product id, the code looks up by SKU) and is reported with `reportError()` so it shows as "Uncaught". The code is typed into the shared door keypad (`src/components/DoorKeypad.tsx`).

### Room 3: API Vault (built)
- **Room id:** `api-vault`
- **Screen:** ShopRight **Order history** page. It shows a friendly empty state: "No orders yet. Start shopping!"
- **Briefing:** "A customer says their order history is empty. They've ordered 40 times. Support says the page 'loads fine'."
- **Bug:** `GET /api/orders` returns **`200 OK`** with an error in the body. The frontend only checks the status code, so it treats the error as "no orders":
  ```json
  {
    "status": "error",
    "orders": [],
    "error": {
      "code": "UPSTREAM_TIMEOUT",
      "message": "Order service did not respond",
      "debug": { "vault_override": "VAULT-0412" }
    }
  }
  ```
  Two bugs in one: the wrong status code (should be 5xx), and internal debug data leaked to the client.
- **Door:** keypad asking for "the override code".
- **Answer:** `VAULT-0412` *(placeholder)*. Ignores case, spaces and dashes.
- **Hints:**
  1. "Loads fine" and "works" aren't the same thing. What did the page actually receive?
  2. Open DevTools > Network, then click **Refresh** on the page (or reload), and click the `orders` request.
  3. Open the Response (or Preview) tab of that request and read the whole body, not just the status.
- **Debrief:**
  - *What was wrong:* the API returned a success status for a failure, and the UI hid the failure behind an empty state.
  - *Why it matters:* monitoring counts 200s as healthy, so the outage is invisible to dashboards and alerts. The debug field leaks internal details to anyone.
  - *Report:* "Order history: API returns 200 OK with an error body; UI shows 'No orders yet'". Severity **High**, Category **Error**. Expected: a 5xx status and an error message on screen ("We couldn't load your orders"). Actual: 200 OK, error hidden, debug data in the response.
  - *Tester tip:* in API testing, assert on the body as well as the status code. A 200 is not a pass.
- **Build notes:** endpoint `api/orders.ts` (GET only; waits ~650 ms so the loading skeleton shows; also sends `x-request-id`). The page has a Refresh button so players don't need to reload. The code is not in the client bundle (checked after build), only in the API response. Its code will be readable in the public repo. That's an accepted trade-off (anyone can also see it by playing). If you want it unspoilable later, generate the code per player from a secret environment variable.

### Room 4: Storage Closet (built)
- **Room id:** `storage-closet`
- **Screen:** ShopRight **Admin › Release controls**. It shows "Access denied. Admins only." and a **Retry** button.
- **Briefing:** "The kill switch for the release is in the admin panel. You're not an admin. Or are you?"
- **Bug:** when the room loads, the server sets a cookie `sr_role=user` (not HttpOnly, not signed). `GET /api/admin` decides who's an admin by reading that cookie. Change it to `admin`, click Retry, and the panel opens.
- **Door:** the admin panel shows a **Release override code**; enter it at the keypad.
- **Answer:** `OVR-88-KILO` *(placeholder)*. Ignores case, spaces and dashes.
- **Hints:**
  1. How does the server know who you are? Something in your browser tells it.
  2. DevTools > Application (Chrome) or Storage (Firefox) > Cookies. Look at what's stored for this site.
  3. Double-click the value of `sr_role`, change it to `admin`, then click Retry.
- **Debrief:**
  - *What was wrong:* the server trusted a role the client sent. Anything in the browser can be changed by the user.
  - *Why it matters:* any customer can make themselves an admin. This is broken access control, number 1 in the OWASP Top 10.
  - *Report:* "Admin panel: access granted by editing the client-side `sr_role` cookie". Severity **Critical**, Category **Security**. Expected: the server checks the role from the authenticated session; editing a cookie changes nothing. Actual: setting `sr_role=admin` opens the admin panel.
  - *Tester tip:* for every permission check, try the request as a lower role (or with the role value changed). Check cookies, localStorage, hidden fields and request bodies for anything that looks like `role`, `isAdmin` or `userId`.
- **Build notes:** `api/session.ts` sets `sr_role=user` only if the cookie isn't there yet (so a reload doesn't undo the player's edit); `api/admin.ts` returns 403 `{ role }` or 200 with the panel and override code. The cookie helper is `api/_lib/cookies.ts`. Starting or restarting the game clears `sr_role`, so a replay starts locked. The code is not in the client bundle (checked after build).

### Room 5: Checkout Gate (built)
- **Room id:** `checkout-gate`
- **Screen:** ShopRight **Checkout**. Cart: one Midnight Hoodie, $40.00. There's a **Staff discount (%)** field. Entering more than 100 shows "Discount must be between 0 and 100" and the Pay button is disabled.
- **Briefing:** "Finance asked one thing: make sure nobody can get paid to shop. Check the discount field."
- **Bug:** the 0–100 limit only exists in the browser (`<input type="number" max="100">` plus a disabled Pay button). `POST /api/checkout` accepts any number. With 101% the total is **−$0.40**, and the server confirms the order and "refunds" the customer.
- **How the player gets past the browser check (any of these):**
  - remove `max="100"` and the `disabled` attribute in Elements, or
  - in the Network tab, copy the checkout request as fetch, change `"discount": 100` to `101`, and run it in the Console, or
  - Firefox: right-click the request › Edit and Resend.
- **Door:** the confirmation shows "Order confirmed. ShopRight owes you $0.40. Refund reference: REF-101-NEG"; enter the reference at the keypad.
- **Answer:** `REF-101-NEG` *(placeholder)*. Ignores case, spaces and dashes.
- **Server behavior (`api/checkout.ts`, POST only):** 0–99 normal order, 100 free order, over 100 negative total plus the refund reference (the same reference for any value over 100), below 0, non-numbers (including the string `"50"`), `null`, a missing field or bad JSON return 400. Decimals are allowed (12.5 → $35.00). Below 0 is handled correctly on purpose, so the player has to find the right boundary.
- **Build notes:** removing only `disabled` isn't enough: the browser's own `max="100"` check still blocks the form, so the player has to deal with both (or skip the UI and resend the request). React doesn't put the attributes back after they're edited, because their values never change between renders. The reference is not in the client bundle (checked after build).
- **Hints:**
  1. The browser says no. Does the server agree?
  2. Try 100 first and watch the request in the Network tab. Then find a way to send 101.
  3. In Elements, find the discount input and delete `max="100"`, then remove `disabled` from the Pay button. Or resend the request with `"discount": 101`.
- **Debrief:**
  - *What was wrong:* validation existed only on the client. The server trusted the number it got.
  - *Why it matters:* anyone with DevTools can bypass client-side checks. Here the store pays customers to shop.
  - *Report:* "Checkout: server accepts discount over 100%, giving a negative total and a refund". Severity **Critical**, Category **Functional**. Steps include the exact request body. Expected: the server rejects discounts above 100 with a 400. Actual: the order is accepted with a total of −$0.40.
  - *Tester tip:* for any number field, test the boundaries: −1, 0, 1, 99, 100, 101, a decimal, a huge number and an empty value. Then repeat the invalid ones against the API directly, skipping the UI.

### Room 6: Dark Room (built)
- **Room id:** `dark-room`
- **Screen:** the power has gone out. The ShopRight page is almost black. A big glowing **EXIT** sign is a decoy (an image; clicking it does nothing). The real exit is a `<button>` with only an SVG icon, no text, no `aria-label`, colored `#111` on `#0d0d0d`, and its focus outline removed.
- **Briefing:** "Power's out on the third floor. The exit is somewhere on this screen. Your eyes won't help."
- **Bug:** the exit button has no accessible name, almost no contrast, and no visible focus. Screen readers announce it as just "button".
- **How the player finds it:** press Tab and watch which element gets focus in Elements, or use the Accessibility pane / full accessibility tree in DevTools.
- **Door:** pressing the button puts a message in a visually hidden `aria-live` region: "Emergency exit code: LUMEN-6". Screen readers read it aloud; sighted players find it in Elements or the accessibility tree. Enter it at the keypad.
- **Answer:** `LUMEN-6` *(placeholder)*. Ignores case, spaces and dashes.
- **Hints:**
  1. Not everyone uses a mouse or can see the screen. How would they get out?
  2. Click the page, then press Tab a few times. Watch Elements to see which element has focus.
  3. Press Enter on the unnamed button, then look for an `aria-live` element in Elements. Its text is the code.
- **Debrief:**
  - *What was wrong:* the only working control had no name, no contrast and no focus indicator (WCAG 1.4.3, 2.4.7, 4.1.2).
  - *Why it matters:* keyboard and screen reader users can't find or understand the control. In many places this is also a legal requirement.
  - *Report:* "Dark Room: exit button has no accessible name, insufficient contrast and no focus indicator". Severity **High**, Category **UI/Display**. Expected: visible text or `aria-label` "Exit", contrast at least 4.5:1, visible focus. Actual: announced as "button", contrast about 1.1:1, focus invisible.
  - *Tester tip:* do one pass of every page with only the keyboard, and run axe or Lighthouse. Both take five minutes.
- **Build notes:** this room must fail axe on purpose. The Playwright suite asserts that it fails with these exact rules (`button-name`, `color-contrast`). `color-contrast` comes from the low-contrast notice text at the top (an icon-only button has no text for axe to measure); `button-name` comes from the exit. The exit is the first focusable element in the page, so one Tab from the HUD reaches it. A faint flashlight follows the mouse for atmosphere but doesn't make the button visible. Clicking the decoy sign shows "It's just a sign." The code is built from character codes; "LUMEN" isn't in the bundle (checked after build).
- **Final hints (as built):** (2) Tab into the page; when focus seems to vanish, check `document.activeElement` or Elements. (3) Press Enter on the unnamed button, then find the `aria-live` element.

### Room 7: The Release Board (final boss)
- **Room id:** `release-board`
- **Screen:** a Jira-style "Release v2.3" board. One card says **BLOCKER: needs a bug report**. Clicking it opens a bug report form.
- **Briefing:** "You found the bugs. Now make them stop the release. The release manager only accepts a proper bug report."
- **Form fields:** which bug (dropdown of the rooms you cleared), title, severity, category, steps to reproduce (one per line), expected result, actual result.
- **Scoring (server-side, `POST /api/report`, out of 100):**

  | Check | Points |
  |---|---|
  | Title is 15–120 characters and names the page or feature | 15 |
  | At least 3 steps | 20 |
  | Expected and actual are filled in and not the same | 20 |
  | Severity is reasonable for the chosen bug (e.g. Login Lobby: Critical or High) | 15 |
  | Category is reasonable for the chosen bug | 10 |
  | Actual result mentions what the player observed (keyword check per bug, e.g. "comment", "200", "cookie") | 20 |

- **Door:** 70 or more blocks the release ("v2.3 has been pulled from tonight's release"). Under 70, the server returns which checks failed, and the player can edit and resubmit.
- **Hints:**
  1. Look back at a debrief. The sample reports show every field you need.
  2. A developer should be able to reproduce it from your steps alone. Write one action per line.
  3. Expected is what *should* happen; actual is what *did* happen. Put what you saw in DevTools in the actual result.
- **Debrief:** replaced by the ending screen: score, rank, time, hints used, and a list of every bug the player found.

### Ending screen
- Final rank, total score, time, hints used.
- "Bugs you found tonight": the 6 bugs with their severity.
- Buttons: Play again, View the source on GitHub.

## Answer checking
- Answers are checked on the server so they can't be read from the game's JavaScript.
- `api/_lib/answers.ts` stores only `sha256("<room-id>:<normalized answer>")`. Each room has its own `normalize` function (e.g. lowercase the username).
- Add a hash with `npm run hash-answer -- <room-id> "<normalized answer>"`.
- Door codes (Rooms 2–6) ignore case, spaces and dashes: `trc 7q4m 2b`, `TRC7Q4M2B` and `TRC-7Q4M-2B` all work. Hash the code uppercase with no dashes (e.g. `TRC7Q4M2B`).
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

## Scoring (draft, change it if you like)
- **Rooms 1–6:** 1000 points each.
- **Hints:** −100 each (up to −300 per room). Already shown in the game.
- **Room 7:** the report score × 10 (70–100 becomes 700–1000).
- **Before-midnight bonus:** +500 if you finish Room 7 before the clock reads 00:00.
- **Maximum:** 7500.
- **Clock:** runs at half speed, so the 13 game minutes to midnight take 26 real minutes, and it pauses while the tab is hidden. (Right now it runs at real speed and never pauses. Change `src/lib/time.ts` when building the ending.)

| Rank | Score |
|---|---|
| Intern on Their First Day | under 3000 |
| Junior Tester | 3000–4499 |
| QA Engineer | 4500–5999 |
| Senior QA | 6000–6999 |
| Release Blocker | 7000+ **and** finished before midnight |

## Progress
Saved in `localStorage` under `release-night:progress:v1`: start time, current room, and per room the time entered, time solved and hints used.
