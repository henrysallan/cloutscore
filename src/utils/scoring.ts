// src/utils/scoring.ts

export interface Profile {
    id: string;
    score: number;
    voteCount: number;
}

export function calculateScoreChange(winner: Profile, loser: Profile): { winnerChange: number; loserChange: number } {
    const kFactor = winner.voteCount < 100 ? 50 : 5; // Adjust K-factor based on vote count
    const expectedWinnerScore = 1 / (1 + Math.pow(10, (loser.score - winner.score) / 400));
    const expectedLoserScore = 1 / (1 + Math.pow(10, (winner.score - loser.score) / 400));

    const winnerChange = Math.round(kFactor * (1 - expectedWinnerScore));
    const loserChange = Math.round(kFactor * (0 - expectedLoserScore));

    return { winnerChange, loserChange };
}

export function updateScores(winnerId: string, loserId: string, profiles: Profile[]): Profile[] {
    const winner = profiles.find(profile => profile.id === winnerId);
    const loser = profiles.find(profile => profile.id === loserId);

    if (!winner || !loser) {
        throw new Error("Winner or loser profile not found");
    }

    const { winnerChange, loserChange } = calculateScoreChange(winner, loser);

    winner.score += winnerChange;
    winner.voteCount += 1;
    loser.score += loserChange;
    loser.voteCount += 1;

    return profiles.map(profile => {
        if (profile.id === winner.id) return winner;
        if (profile.id === loser.id) return loser;
        return profile;
    });
}