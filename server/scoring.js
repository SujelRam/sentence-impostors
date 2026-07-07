/**
 * Scoring Module — Sentence Impostors
 * Multi-tier scoring: sentence accuracy + grammar heuristics + time bonus + bonuses
 */

/**
 * Normalise a word for comparison: lowercase + strip trailing punctuation.
 */
function normalise(word) {
  return word.replace(/[.,!?;:'"-]$/g, '').toLowerCase();
}

function calculateScore({
  playerAnswer = [],
  correctSentence = '',
  timeLeft = 0,
  totalTime = 60,
  usedHint = false,
  isEmergency = false,
  streak = 0,
  hasImpostorWord = false,
  impostorWord = null,
}) {
  const correctWords = correctSentence.trim().split(/\s+/);
  const normCorrect = correctWords.map(normalise);
  
  if (!playerAnswer || playerAnswer.length === 0) {
    return {
      sentenceScore: 0, grammarScore: 0, timeBonus: 0,
      impostorBonus: 0, streakBonus: 0, hintPenalty: 0,
      total: 0, isFullyCorrect: false, partialAccuracy: 0,
    };
  }

  const normPlayer = playerAnswer.map(normalise);
  const isFullyCorrect = normPlayer.join(' ') === normCorrect.join(' ');

  if (!isFullyCorrect) {
    return {
      sentenceScore: 0, grammarScore: 0, timeBonus: 0,
      impostorBonus: 0, streakBonus: 0, hintPenalty: 0,
      total: 0, isFullyCorrect: false, partialAccuracy: 0,
    };
  }

  // Exact Match Scoring
  let sentenceScore = 70;
  let grammarScore = 20;
  let timeBonus = timeLeft > 0 ? Math.round((timeLeft / totalTime) * 10) : 0;
  let impostorBonus = hasImpostorWord ? 20 : 0;
  let hintPenalty = usedHint ? 10 : 0;

  let total = sentenceScore + grammarScore + timeBonus + impostorBonus - hintPenalty;

  if (isEmergency) {
    sentenceScore *= 2;
    grammarScore *= 2;
    timeBonus *= 2;
    total = sentenceScore + grammarScore + timeBonus + impostorBonus - hintPenalty;
  }

  let streakBonus = 0;
  if (streak >= 2) {
    streakBonus = Math.min(25, streak * 5);
    total += streakBonus;
  }

  return {
    sentenceScore,
    grammarScore,
    timeBonus,
    impostorBonus,
    streakBonus,
    hintPenalty,
    total,
    isFullyCorrect: true,
    partialAccuracy: 100,
  };
}

module.exports = { calculateScore };
