const STORAGE_KEYS = {
  QUESTIONS: 'cat_questions',
  TESTS: 'cat_tests',
  ATTEMPTS: 'cat_attempts',
  IN_PROGRESS: 'cat_in_progress', // for auto-save during test
};

// ─── Generic helpers ─────────────────────────────────────────────

function getItem(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setItem(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.error('localStorage quota exceeded');
      return false;
    }
    throw e;
  }
}

// ─── Questions ───────────────────────────────────────────────────

export function getQuestions() {
  return getItem(STORAGE_KEYS.QUESTIONS);
}

export function getQuestionById(id) {
  return getQuestions().find((q) => q.id === id) || null;
}

export function getQuestionsByIds(ids) {
  const questions = getQuestions();
  const map = new Map(questions.map((q) => [q.id, q]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

export function saveQuestion(question) {
  const questions = getQuestions();
  questions.push(question);
  return setItem(STORAGE_KEYS.QUESTIONS, questions);
}

export function updateQuestion(id, updates) {
  const questions = getQuestions();
  const idx = questions.findIndex((q) => q.id === id);
  if (idx === -1) return false;
  questions[idx] = { ...questions[idx], ...updates };
  return setItem(STORAGE_KEYS.QUESTIONS, questions);
}

export function deleteQuestion(id) {
  const questions = getQuestions().filter((q) => q.id !== id);
  return setItem(STORAGE_KEYS.QUESTIONS, questions);
}

export function deleteQuestions(ids) {
  const idSet = new Set(ids);
  const questions = getQuestions().filter((q) => !idSet.has(q.id));
  return setItem(STORAGE_KEYS.QUESTIONS, questions);
}

// ─── Tests ───────────────────────────────────────────────────────

export function getTests() {
  return getItem(STORAGE_KEYS.TESTS);
}

export function getTestById(id) {
  return getTests().find((t) => t.id === id) || null;
}

export function saveTest(test) {
  const tests = getTests();
  tests.push(test);
  return setItem(STORAGE_KEYS.TESTS, tests);
}

export function deleteTest(id) {
  const tests = getTests().filter((t) => t.id !== id);
  return setItem(STORAGE_KEYS.TESTS, tests);
}

// ─── Attempts ────────────────────────────────────────────────────

export function getAttempts() {
  return getItem(STORAGE_KEYS.ATTEMPTS);
}

export function getAttemptById(id) {
  return getAttempts().find((a) => a.id === id) || null;
}

export function getAttemptsByTestId(testId) {
  return getAttempts().filter((a) => a.testId === testId);
}

export function saveAttempt(attempt) {
  const attempts = getAttempts();
  attempts.push(attempt);
  return setItem(STORAGE_KEYS.ATTEMPTS, attempts);
}

// ─── In-Progress Test (auto-save) ───────────────────────────────

export function getInProgressTest() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.IN_PROGRESS);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveInProgressTest(data) {
  return setItem(STORAGE_KEYS.IN_PROGRESS, data);
}

export function clearInProgressTest() {
  localStorage.removeItem(STORAGE_KEYS.IN_PROGRESS);
}

// ─── Storage Usage ───────────────────────────────────────────────

export function getStorageUsage() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    total += (key.length + value.length) * 2; // UTF-16, 2 bytes per char
  }
  const maxBytes = 5 * 1024 * 1024; // 5MB typical limit
  return {
    usedBytes: total,
    maxBytes,
    usedMB: (total / (1024 * 1024)).toFixed(2),
    maxMB: (maxBytes / (1024 * 1024)).toFixed(0),
    percentage: Math.min(100, ((total / maxBytes) * 100).toFixed(1)),
  };
}
