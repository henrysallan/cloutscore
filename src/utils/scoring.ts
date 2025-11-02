// src/utils/scoring.ts
import {
  INITIAL_SCORE,
  MIN_SCORE,
  NEW_PROFILE_CHANGE,
  ESTABLISHED_PROFILE_CHANGE,
  ESTABLISHED_THRESHOLD,
} from './constants';

export interface Profile {
  id: string;
  score: number;
  voteCount: number;
}

export interface ScoreChange {
  winnerChange: number;
  loserChange: number;
  winnerNewScore: number;
  loserNewScore: number;
}

/**
 * Calculate score changes for a vote using modified Elo formula
 * - New profiles (< ESTABLISHED_THRESHOLD votes): ±100 points
 * - Established profiles (≥ ESTABLISHED_THRESHOLD votes): ±1 point
 * - Accounts for score difference (Elo upset calculations)
 * - Enforces minimum score floor of MIN_SCORE
 */
export function calculateScoreChange(winner: Profile, loser: Profile): ScoreChange {
  // 1. Calculate Elo expected scores (probability of winning)
  const expectedWinner = 1 / (1 + Math.pow(10, (loser.score - winner.score) / 400));
  const expectedLoser = 1 - expectedWinner;

  // 2. Determine K-factor based on vote counts (volatility)
  const winnerK = winner.voteCount < ESTABLISHED_THRESHOLD
    ? NEW_PROFILE_CHANGE
    : ESTABLISHED_PROFILE_CHANGE;
  const loserK = loser.voteCount < ESTABLISHED_THRESHOLD
    ? NEW_PROFILE_CHANGE
    : ESTABLISHED_PROFILE_CHANGE;

  // 3. Calculate raw score changes
  // Winner: K * (actual outcome 1 - expected)
  // Loser: K * (actual outcome 0 - expected)
  const rawWinnerChange = Math.round(winnerK * (1 - expectedWinner));
  const rawLoserChange = Math.round(loserK * (0 - expectedLoser));

  // 4. Calculate proposed new scores
  const proposedWinnerScore = winner.score + rawWinnerChange;
  const proposedLoserScore = loser.score + rawLoserChange;

  // 5. Apply minimum score floor
  const finalWinnerScore = Math.max(MIN_SCORE, proposedWinnerScore);
  const finalLoserScore = Math.max(MIN_SCORE, proposedLoserScore);

  // 6. Calculate actual changes (may differ from raw if floor applied)
  const winnerChange = finalWinnerScore - winner.score;
  const loserChange = finalLoserScore - loser.score;

  return {
    winnerChange,
    loserChange,
    winnerNewScore: finalWinnerScore,
    loserNewScore: finalLoserScore,
  };
}

/**
 * Pre-calculate both possible outcomes for a pair
 * Used for pre-fetching to show potential score changes
 */
export function calculateBothOutcomes(profileA: Profile, profileB: Profile): {
  outcomeA: ScoreChange; // If A wins
  outcomeB: ScoreChange; // If B wins
} {
  return {
    outcomeA: calculateScoreChange(profileA, profileB), // A wins
    outcomeB: calculateScoreChange(profileB, profileA), // B wins
  };
}

/**
 * Validate that a score is within allowed bounds
 */
export function validateScore(score: number): number {
  return Math.max(MIN_SCORE, score);
}
