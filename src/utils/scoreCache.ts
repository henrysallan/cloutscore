// src/utils/scoreCache.ts

interface CachedScore {
  score: number;
  timestamp: number;
}

const CACHE_KEY = 'cloutscore_optimistic_scores';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function getCachedScore(profileId: string): number | null {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return null;

    const cachedScores: Record<string, CachedScore> = JSON.parse(cache);
    const cachedScore = cachedScores[profileId];

    if (!cachedScore) return null;

    // Check if cache has expired
    const now = Date.now();
    if (now - cachedScore.timestamp > CACHE_DURATION) {
      // Remove expired entry
      delete cachedScores[profileId];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedScores));
      return null;
    }

    return cachedScore.score;
  } catch (error) {
    console.error('Error reading score cache:', error);
    return null;
  }
}

export function setCachedScore(profileId: string, score: number): void {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    const cachedScores: Record<string, CachedScore> = cache ? JSON.parse(cache) : {};

    cachedScores[profileId] = {
      score,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedScores));
  } catch (error) {
    console.error('Error writing score cache:', error);
  }
}

export function clearExpiredScores(): void {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return;

    const cachedScores: Record<string, CachedScore> = JSON.parse(cache);
    const now = Date.now();
    let hasChanges = false;

    Object.keys(cachedScores).forEach((profileId) => {
      if (now - cachedScores[profileId].timestamp > CACHE_DURATION) {
        delete cachedScores[profileId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedScores));
    }
  } catch (error) {
    console.error('Error clearing expired scores:', error);
  }
}

export function clearAllCachedScores(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing all cached scores:', error);
  }
}
