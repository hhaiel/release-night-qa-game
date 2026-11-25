/**
 * Scoring rules for Room 7 (The Release Board): the player writes a bug report for one of the
 * bugs they found, and the server scores it out of 100. 70 or more blocks the release.
 *
 * Kept on the server so the rules (and keywords) aren't in the game's JavaScript.
 */

export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export const CATEGORIES = [
  'Functional',
  'Security',
  'UI/Display',
  'Accessibility',
  'Content',
  'Data Discrepancy',
  'Performance',
  'Error',
] as const;

interface BugRule {
  /** Words that show the title names the right page or feature. */
  featureWords: string[];
  severities: string[];
  categories: string[];
  /** Words that show the actual result describes what the player really observed. */
  evidenceWords: string[];
}

export const BUG_RULES: Record<string, BugRule> = {
  'login-lobby': {
    featureWords: ['login', 'log in', 'sign in', 'sign-in', 'signin'],
    severities: ['Critical', 'High'],
    categories: ['Security'],
    evidenceWords: ['comment', 'password', 'credential', 'qa_temp', 'username', 'source', 'html'],
  },
  'console-corridor': {
    featureWords: ['cart', 'add to cart', 'product'],
    severities: ['Critical', 'High', 'Medium'],
    categories: ['Functional', 'Error'],
    evidenceWords: ['console', 'typeerror', 'error', 'count', 'toast', 'trace', 'stays at 0', 'not added'],
  },
  'api-vault': {
    featureWords: ['order', 'api', 'history'],
    severities: ['Critical', 'High'],
    categories: ['Error', 'Functional', 'Data Discrepancy', 'Security'],
    evidenceWords: ['200', 'status', 'body', 'timeout', 'upstream', 'no orders', 'debug', 'error'],
  },
  'storage-closet': {
    featureWords: ['admin', 'release control', 'access', 'permission', 'authorization'],
    severities: ['Critical', 'High'],
    categories: ['Security'],
    evidenceWords: ['cookie', 'sr_role', 'role', '403', 'admin panel'],
  },
  'checkout-gate': {
    featureWords: ['checkout', 'discount', 'payment'],
    severities: ['Critical', 'High'],
    categories: ['Functional', 'Security', 'Data Discrepancy'],
    evidenceWords: ['101', 'negative', 'refund', '-0.40', '−0.40', '0.40', 'total'],
  },
  'dark-room': {
    featureWords: ['exit', 'button', 'floor', 'dark room'],
    severities: ['Critical', 'High', 'Medium'],
    categories: ['UI/Display', 'Accessibility'],
    evidenceWords: ['name', 'label', 'contrast', 'focus', 'screen reader', 'keyboard', 'aria', 'axe'],
  },
};

export interface ReportInput {
  bug: string;
  title: string;
  severity: string;
  category: string;
  steps: string;
  expected: string;
  actual: string;
}

export interface Check {
  id: string;
  label: string;
  points: number;
  earned: number;
  /** Shown when the check didn't get full points. */
  tip: string;
}

export const PASS_MARK = 70;

const has = (text: string, words: string[]) => {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
};

export function scoreReport(input: ReportInput): { score: number; passed: boolean; checks: Check[] } {
  const rule = BUG_RULES[input.bug];
  const title = input.title.trim();
  const steps = input.steps
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const expected = input.expected.trim();
  const actual = input.actual.trim();

  const titleLengthOk = title.length >= 15 && title.length <= 120;
  const titleNamesFeature = has(title, rule.featureWords);
  const expectedActualOk =
    expected.length >= 10 && actual.length >= 10 && expected.toLowerCase() !== actual.toLowerCase();

  const checks: Check[] = [
    {
      id: 'title',
      label: 'Title is 15–120 characters and names the page or feature',
      points: 15,
      earned: titleLengthOk && titleNamesFeature ? 15 : titleLengthOk ? 7 : 0,
      tip: !titleLengthOk
        ? 'Make the title 15–120 characters: short enough to scan, long enough to say what’s wrong.'
        : 'Start the title with where the bug is (the page or feature), e.g. "Checkout: …".',
    },
    {
      id: 'steps',
      label: 'At least 3 steps to reproduce, one per line',
      points: 20,
      earned: steps.length >= 3 ? 20 : steps.length === 2 ? 10 : 0,
      tip: 'Write at least 3 steps, one action per line, so a developer can reproduce it without asking you.',
    },
    {
      id: 'expected-actual',
      label: 'Expected and actual results are filled in and different',
      points: 20,
      earned: expectedActualOk ? 20 : 0,
      tip: 'Expected is what should happen; actual is what did happen. Both need a real sentence, and they can’t be the same.',
    },
    {
      id: 'severity',
      label: 'Severity fits the impact of this bug',
      points: 15,
      earned: rule.severities.includes(input.severity) ? 15 : 0,
      tip: 'Think about impact: could someone lose money, data or access? Look back at how the debrief rated it.',
    },
    {
      id: 'category',
      label: 'Category fits the type of bug',
      points: 10,
      earned: rule.categories.includes(input.category) ? 10 : 0,
      tip: 'Pick the category that best describes the type of problem (e.g. Security for access or leaked data).',
    },
    {
      id: 'evidence',
      label: 'Actual result describes what you observed (in DevTools or on screen)',
      points: 20,
      earned: has(actual, rule.evidenceWords) ? 20 : 0,
      tip: 'Put the evidence in the actual result: the error text, status code, cookie value or number you saw.',
    },
  ];

  const score = checks.reduce((sum, c) => sum + c.earned, 0);
  return { score, passed: score >= PASS_MARK, checks };
}
