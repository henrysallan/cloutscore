import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

export const processVotes = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    const votesSnapshot = await db.collection('votes').where('processed', '==', false).get();
    
    if (votesSnapshot.empty) {
        console.log('No unprocessed votes found.');
        return null;
    }

    const scoreUpdates: { [key: string]: number } = {};
    const voteCounts: { [key: string]: number } = {};

    votesSnapshot.forEach(doc => {
        const vote = doc.data();
        const { winnerId, loserId } = vote;

        // Initialize score updates and vote counts
        if (!scoreUpdates[winnerId]) scoreUpdates[winnerId] = 0;
        if (!scoreUpdates[loserId]) scoreUpdates[loserId] = 0;
        if (!voteCounts[winnerId]) voteCounts[winnerId] = 0;
        if (!voteCounts[loserId]) voteCounts[loserId] = 0;

        // Calculate score changes based on modified Elo formula
        const winnerScore = getProfileScore(winnerId);
        const loserScore = getProfileScore(loserId);
        const scoreChange = calculateScoreChange(winnerScore, loserScore);

        scoreUpdates[winnerId] += scoreChange;
        scoreUpdates[loserId] -= scoreChange;

        voteCounts[winnerId]++;
        voteCounts[loserId]++;
    });

    // Update profile scores in batches
    const batch = db.batch();
    for (const profileId in scoreUpdates) {
        const newScore = await getProfileScore(profileId) + scoreUpdates[profileId];
        batch.update(db.collection('profiles').doc(profileId), { score: newScore, voteCount: voteCounts[profileId] });
    }

    await batch.commit();

    // Mark votes as processed
    const processedBatch = db.batch();
    votesSnapshot.forEach(doc => {
        processedBatch.update(doc.ref, { processed: true });
    });
    await processedBatch.commit();

    console.log('Votes processed and scores updated.');
    return null;
});

const getProfileScore = async (profileId: string): Promise<number> => {
    const profileDoc = await db.collection('profiles').doc(profileId).get();
    return profileDoc.exists ? profileDoc.data()?.score || 1000 : 1000; // Default score if not found
};

const calculateScoreChange = (winnerScore: number, loserScore: number): number => {
    // Implement the modified Elo calculation logic here
    const kFactor = 30; // Example K-factor
    const expectedScore = 1 / (1 + Math.pow(10, (loserScore - winnerScore) / 400));
    return Math.round(kFactor * (1 - expectedScore));
};