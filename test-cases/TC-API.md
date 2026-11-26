# Test cases: API

**Source of truth:** [docs/game-design.md](../docs/game-design.md) (API contract and each room's server behavior).
**Automation:** `tests/api/check.spec.ts`, `tests/api/rooms-api.spec.ts` (Playwright `request`, no browser). Data-driven IDs (one ID, several rows of data) run as one test per data row.
**Executed:** 2026-11-26. Status reflects that run.

> Rooms 3–5 endpoints are **broken on purpose**. Their test cases pin the bug down exactly, so an accidental "fix" fails the build.

## Requirement gaps
- `/api/check` has no rate limit, so codes could be brute-forced. Accepted for a game (codes are discoverable anyway); not tested.
- The contract doesn't define the response when Content-Type isn't JSON but the body is valid JSON. Observed: accepted. Not tested.

## Test cases

| Test Case ID | Feature Name | Test Case/Scenario | Pre-requisite | Test Steps | Test Data | Expected Results | Browsers | Status | Actual Results |
|---|---|---|---|---|---|---|---|---|---|
| TC-API-001 | POST /api/check | Verify the right answer is accepted for each code room | Server running | 1. POST `{ room, answer }` for each room. | login-lobby `qa_temp:Midnight#23`; console-corridor TRC-7Q4M-2B; api-vault VAULT-0412; storage-closet OVR-88-KILO; checkout-gate REF-101-NEG; dark-room LUMEN-6 | 200 `{ "correct": true }` for all 6. | API | Pass | As expected |
| TC-API-002 | POST /api/check | Verify a wrong answer is a normal 200 result | Server running | 1. POST a wrong answer. | api-vault, VAULT-0000 | 200 `{ "correct": false }`. | API | Pass | As expected |
| TC-API-003 | POST /api/check | Verify Room 1 usernames ignore case and spaces but passwords are exact | Server running | 1. POST username with odd case and spaces.<br>2. POST correct username, lowercase password. | "  QA_Temp :Midnight#23"; "qa_temp:midnight#23" | First: correct true. Second: correct false. | API | Pass | As expected |
| TC-API-004 | POST /api/check | Verify door codes ignore case, spaces and dashes | Server running | 1. POST each variant for console-corridor. | trc-7q4m-2b; TRC 7Q4M 2B; TRC7Q4M2B; " t r c - 7 q 4 m - 2 b " | correct true for all 4. | API | Pass | As expected |
| TC-API-005 | POST /api/check | Verify an unknown room is 404 | Server running | 1. POST room "basement". | — | 404 `{ "error": "Unknown room" }`. | API | Pass | As expected |
| TC-API-006 | POST /api/check | Verify a body that isn't JSON is 400 | Server running | 1. POST "not json" with JSON content type. | — | 400. | API | Pass | As expected |
| TC-API-007 | POST /api/check | Verify missing or non-string fields are 400 | Server running | 1. POST each malformed body. | `{}`; no answer; answer 6; room 1 | 400 for all 4. | API | Pass | As expected |
| TC-API-008 | POST /api/check | Verify the 200-character answer limit (boundary) | Server running | 1. POST a 200-character answer.<br>2. POST a 201-character answer. | 200 and 201 × "x" | 200 for 200 chars; 400 for 201 chars. | API | Pass | As expected |
| TC-API-009 | POST /api/check | Verify GET is not allowed | Server running | 1. GET /api/check. | — | 405. | API | Pass | As expected |
| TC-API-020 | GET /api/orders (Room 3) | Verify the endpoint answers 200 OK with an error body and leaked debug data (bug as designed) | Server running | 1. GET /api/orders. | — | 200, cache-control no-store, body status "error", orders [], error.code UPSTREAM_TIMEOUT, debug.vault_override VAULT-0412. | API | Pass | As expected |
| TC-API-021 | GET /api/orders (Room 3) | Verify only GET is allowed | Server running | 1. POST /api/orders. | — | 405. | API | Pass | As expected |
| TC-API-030 | GET /api/session (Room 4) | Verify sr_role=user is set only when there is no cookie, and isn't HttpOnly | Server running | 1. GET with no cookie.<br>2. GET with sr_role=admin. | — | First: Set-Cookie sr_role=user without HttpOnly. Second: no Set-Cookie; body role admin. | API | Pass | As expected |
| TC-API-031 | GET /api/admin (Room 4) | Verify non-admin roles get 403 | Server running | 1. GET with each cookie. | none; sr_role=user; sr_role=Admin; sr_role=superuser | 403 `{ "error": "Forbidden" }` for all 4. | API | Pass | As expected |
| TC-API-032 | GET /api/admin (Room 4) | Verify the endpoint trusts sr_role=admin from the client (bug as designed) | Server running | 1. GET with cookie "other=1; sr_role=admin". | — | 200 with overrideCode OVR-88-KILO. | API | Pass | As expected |
| TC-API-040 | POST /api/checkout (Room 5) | Verify discount boundaries; over 100 is accepted (bug as designed) | Server running | 1. POST each discount. | −1; 0; 1; 12.5; 99; 100; 101; 150; "50"; null | −1, "50", null: 400. 0→$40, 1→$39.60, 12.5→$35, 99→$0.40, 100→$0 (no refund). 101→−$0.40 and 150→−$20, both confirmed with refund REF-101-NEG. | API | Pass | As expected |
| TC-API-041 | POST /api/checkout (Room 5) | Verify missing discount, bad JSON and GET are rejected | Server running | 1. POST `{}`.<br>2. POST "x".<br>3. GET. | — | 400, 400, 405. | API | Pass | As expected |
| TC-API-050 | POST /api/report (Room 7) | Verify a complete report scores 100 and passes | Server running | 1. POST a complete report. | checkout-gate report with all fields | 200, score 100, passed true, passMark 70, 6 checks. | API | Pass | As expected |
| TC-API-051 | POST /api/report (Room 7) | Verify partial credit and the pass mark | Server running | 1. POST a report with a generic title, 2 steps, no evidence. | — | score 62, passed false. Title 7, steps 10, expected-actual 20, severity 15, category 10, evidence 0. | API | Pass | As expected |
| TC-API-052 | POST /api/report (Room 7) | Verify identical expected and actual earn nothing (case-insensitive) | Server running | 1. POST expected and actual that differ only in case. | "It works fine here." / "it works fine here." | expected-actual check earns 0. | API | Pass | As expected |
| TC-API-053 | POST /api/report (Room 7) | Verify bad input is 400 | Server running | 1. POST each bad body. | unknown bug; missing title; severity 3; 201-char title; "x" | 400 for all 5. | API | Pass | As expected |

**20 test case IDs (40 automated tests, counting data rows).** Cover the full `/api/check` contract and every room endpoint.
