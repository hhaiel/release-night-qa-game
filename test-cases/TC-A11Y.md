# Test cases: accessibility

**Standard:** WCAG 2.1 A and AA, checked with axe-core (`@axe-core/playwright`, tags wcag2a, wcag2aa, wcag21a, wcag21aa).
**Automation:** `tests/a11y/axe.spec.ts`. Tests run with reduced motion so colors are measured at their final values.
**Executed:** 2026-11-26, Chromium. Status reflects that run.

> Room 6 (Dark Room) is **meant to fail**: its bug is accessibility itself. TC-A11Y-016 passes when axe reports exactly the intended violations.

## Requirement gaps
- axe can't measure contrast for text on gradient backgrounds; it reports those as "incomplete", not violations. That is why Room 6's intended contrast bug went undetected at first (DEF-009); gradient areas need a manual check.
- Automated checks cover roughly a third of WCAG. Keyboard-only and screen reader passes are still needed by hand; Room 6's keyboard path is covered in TC-R6-001.

## Test cases

| Test Case ID | Feature Name | Test Case/Scenario | Pre-requisite | Test Steps | Test Data | Expected Results | Browsers | Status | Actual Results |
|---|---|---|---|---|---|---|---|---|---|
| TC-A11Y-001 | Intro | Verify the intro screen has no WCAG 2.1 AA violations | No saved progress | 1. Open the game.<br>2. Run axe. | — | 0 violations. | Chromium | Pass | As expected |
| TC-A11Y-011 | Room 1 | Verify Room 1 has no violations | Game open at Room 1 | 1. Run axe. | — | 0 violations. | Chromium | Pass | Passed after DEF-006 fix |
| TC-A11Y-012 | Room 2 | Verify Room 2 has no violations | Game open at Room 2 | 1. Run axe. | — | 0 violations. | Chromium | Pass | Passed after DEF-006 and DEF-007 fixes |
| TC-A11Y-013 | Room 3 | Verify Room 3 has no violations (after orders load) | Game open at Room 3 | 1. Wait for "No orders yet".<br>2. Run axe. | — | 0 violations. | Chromium | Pass | Passed after DEF-006 fix |
| TC-A11Y-014 | Room 4 | Verify Room 4 has no violations (Access denied state) | Game open at Room 4 | 1. Wait for "Access denied".<br>2. Run axe. | — | 0 violations. | Chromium | Pass | Passed after DEF-006 and DEF-007 fixes |
| TC-A11Y-015 | Room 5 | Verify Room 5 has no violations | Game open at Room 5 | 1. Run axe. | — | 0 violations. | Chromium | Pass | Passed after DEF-006 fix |
| TC-A11Y-016 | Room 6 | Verify Room 6 FAILS with exactly button-name and color-contrast, both inside the room | Game open at Room 6 | 1. Run axe. | — | Violations are exactly button-name and color-contrast, and every failing element is inside the dark room. | Chromium | Pass | Passed after DEF-006 and DEF-009 fixes |
| TC-A11Y-017 | Room 7 | Verify Room 7 has no violations with the report form open | Game open at Room 7 | 1. Click the Blocker card.<br>2. Run axe. | — | 0 violations. | Chromium | Pass | Passed after DEF-006 fix |
| TC-A11Y-020 | Debrief | Verify a debrief screen has no violations | Game open at Room 2 | 1. Solve Room 2.<br>2. Run axe on the debrief. | TRC-7Q4M-2B | 0 violations. | Chromium | Pass | As expected |

**9 test cases.** Every screen type is covered: intro, all 7 rooms, debrief. The ending screen's score label is covered by TC-GAME-010 (DEF-008).
