import localforage from 'localforage';

localforage.config({
  name: 'CAT_Mock_Platform',
  storeName: 'cat_data'
});

const STORAGE_KEYS = {
  QUESTIONS: 'cat_questions',
  TESTS: 'cat_tests',
  ATTEMPTS: 'cat_attempts',
  IN_PROGRESS: 'cat_in_progress', // for auto-save during test
};

// ─── Generic helpers ─────────────────────────────────────────────

async function getItem(key) {
  try {
    const data = await localforage.getItem(key);
    return data || [];
  } catch {
    return [];
  }
}

async function setItem(key, data) {
  try {
    await localforage.setItem(key, data);
    return true;
  } catch (e) {
    console.error('IndexedDB write failed', e);
    return false;
  }
}

// ─── Questions ───────────────────────────────────────────────────

export async function getQuestions() {
  return await getItem(STORAGE_KEYS.QUESTIONS);
}

export async function getQuestionById(id) {
  const questions = await getQuestions();
  return questions.find((q) => q.id === id) || null;
}

export async function getQuestionsByIds(ids) {
  const questions = await getQuestions();
  const map = new Map(questions.map((q) => [q.id, q]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

export async function saveQuestion(question) {
  const questions = await getQuestions();
  questions.push(question);
  return await setItem(STORAGE_KEYS.QUESTIONS, questions);
}

export async function updateQuestion(id, updates) {
  const questions = await getQuestions();
  const idx = questions.findIndex((q) => q.id === id);
  if (idx === -1) return false;
  questions[idx] = { ...questions[idx], ...updates };
  return await setItem(STORAGE_KEYS.QUESTIONS, questions);
}

export async function deleteQuestion(id) {
  let questions = await getQuestions();
  questions = questions.filter((q) => q.id !== id);
  return await setItem(STORAGE_KEYS.QUESTIONS, questions);
}

export async function deleteQuestions(ids) {
  const idSet = new Set(ids);
  let questions = await getQuestions();
  questions = questions.filter((q) => !idSet.has(q.id));
  return await setItem(STORAGE_KEYS.QUESTIONS, questions);
}

// ─── Tests ───────────────────────────────────────────────────────

export async function getTests() {
  return await getItem(STORAGE_KEYS.TESTS);
}

export async function getTestById(id) {
  const tests = await getTests();
  return tests.find((t) => t.id === id) || null;
}

export async function saveTest(test) {
  const tests = await getTests();
  tests.push(test);
  return await setItem(STORAGE_KEYS.TESTS, tests);
}

export async function deleteTest(id) {
  let tests = await getTests();
  tests = tests.filter((t) => t.id !== id);
  return await setItem(STORAGE_KEYS.TESTS, tests);
}

// ─── Attempts ────────────────────────────────────────────────────

export async function getAttempts() {
  return await getItem(STORAGE_KEYS.ATTEMPTS);
}

export async function getAttemptById(id) {
  const attempts = await getAttempts();
  return attempts.find((a) => a.id === id) || null;
}

export async function getAttemptsByTestId(testId) {
  const attempts = await getAttempts();
  return attempts.filter((a) => a.testId === testId);
}

export async function saveAttempt(attempt) {
  const attempts = await getAttempts();
  attempts.push(attempt);
  return await setItem(STORAGE_KEYS.ATTEMPTS, attempts);
}

// ─── In-Progress Test (auto-save) ───────────────────────────────

export async function getInProgressTest() {
  try {
    const data = await localforage.getItem(STORAGE_KEYS.IN_PROGRESS);
    return data || null;
  } catch {
    return null;
  }
}

export async function saveInProgressTest(data) {
  return await setItem(STORAGE_KEYS.IN_PROGRESS, data);
}

export async function clearInProgressTest() {
  await localforage.removeItem(STORAGE_KEYS.IN_PROGRESS);
}
