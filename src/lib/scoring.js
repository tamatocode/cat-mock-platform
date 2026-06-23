/**
 * CAT Marking Scheme
 * 
 * MCQ:  +3 correct, -1 wrong, 0 unattempted
 * TITA: +3 correct,  0 wrong, 0 unattempted (no negative marking)
 */

const TITA_TOLERANCE = 0.01;

/**
 * Score a single question response
 * @param {Object} question - The question object
 * @param {Object} response - The response object { selectedOption, typedAnswer, status }
 * @returns {{ marks: number, isCorrect: boolean, isAttempted: boolean }}
 */
export function scoreQuestion(question, response) {
  // Not attempted
  if (
    !response ||
    response.status === 'not-answered' ||
    response.status === undefined
  ) {
    // Check if they actually answered despite status
    const hasAnswer = question.type === 'MCQ'
      ? response?.selectedOption != null
      : response?.typedAnswer != null && response?.typedAnswer !== '';
    
    if (!hasAnswer) {
      return { marks: 0, isCorrect: false, isAttempted: false };
    }
  }

  if (question.type === 'MCQ') {
    return scoreMCQ(question, response);
  }
  return scoreTITA(question, response);
}

function scoreMCQ(question, response) {
  if (!response.selectedOption) {
    return { marks: 0, isCorrect: false, isAttempted: false };
  }

  const isCorrect = response.selectedOption === question.correctOption;
  return {
    marks: isCorrect ? 3 : -1,
    isCorrect,
    isAttempted: true,
  };
}

function scoreTITA(question, response) {
  if (response.typedAnswer == null || response.typedAnswer === '') {
    return { marks: 0, isCorrect: false, isAttempted: false };
  }

  const userAnswer = parseFloat(response.typedAnswer);
  const correctAnswer = parseFloat(question.correctAnswer);

  if (isNaN(userAnswer) || isNaN(correctAnswer)) {
    return { marks: 0, isCorrect: false, isAttempted: true };
  }

  const isCorrect = Math.abs(userAnswer - correctAnswer) <= TITA_TOLERANCE;
  return {
    marks: isCorrect ? 3 : 0, // No negative for TITA
    isCorrect,
    isAttempted: true,
  };
}

/**
 * Score an entire test attempt
 * @param {Object} test - The mock test object
 * @param {Object[]} questions - Array of question objects (all questions in the test)
 * @param {Object} responses - Map of questionId → response
 * @returns {Object} Score breakdown
 */
export function scoreTest(test, questions, responses) {
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const sectionScores = {};
  let totalScore = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalUnattempted = 0;

  for (const section of test.sections) {
    let sectionScore = 0;
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let attempted = 0;

    for (const qId of section.questionIds) {
      const question = questionMap.get(qId);
      if (!question) continue;

      const response = responses[qId];
      const result = scoreQuestion(question, response);

      sectionScore += result.marks;

      if (!result.isAttempted) {
        unattempted++;
      } else if (result.isCorrect) {
        correct++;
        attempted++;
      } else {
        incorrect++;
        attempted++;
      }
    }

    sectionScores[section.name] = {
      score: sectionScore,
      questions: section.questionIds.length,
      attempted,
      correct,
      incorrect,
      unattempted,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    };

    totalScore += sectionScore;
    totalCorrect += correct;
    totalIncorrect += incorrect;
    totalUnattempted += unattempted;
  }

  return {
    total: totalScore,
    maxPossible: questions.length * 3,
    correct: totalCorrect,
    incorrect: totalIncorrect,
    unattempted: totalUnattempted,
    sections: sectionScores,
  };
}

/**
 * Approximate CAT percentile from raw score
 */
export function getPercentile(score) {
  if (score >= 160) return { value: 99.5, label: '99.5%ile' };
  if (score >= 140) return { value: 99, label: '99%ile' };
  if (score >= 120) return { value: 97, label: '97%ile' };
  if (score >= 100) return { value: 94, label: '94%ile' };
  if (score >= 80)  return { value: 88, label: '88%ile' };
  if (score >= 60)  return { value: 78, label: '78%ile' };
  return { value: 70, label: '< 70%ile' };
}
