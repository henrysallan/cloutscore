import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// Constants matching client-side
const MIN_SCORE = 100;
const NEW_PROFILE_CHANGE = 100;
const ESTABLISHED_PROFILE_CHANGE = 1;
const ESTABLISHED_THRESHOLD = 100;

interface Profile {
  score: number;
  voteCount: number;
}

/**
 * Calculate score changes using modified Elo formula
 */
function calculateScoreChange(winner: Profile, loser: Profile): {
  winnerChange: number;
  loserChange: number;
} {
  // 1. Calculate Elo expected scores
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
  const rawWinnerChange = Math.round(winnerK * (1 - expectedWinner));
  const rawLoserChange = Math.round(loserK * (0 - expectedLoser));

  // 4. Apply minimum score floor
  const proposedWinnerScore = winner.score + rawWinnerChange;
  const proposedLoserScore = loser.score + rawLoserChange;
  
  const finalWinnerScore = Math.max(MIN_SCORE, proposedWinnerScore);
  const finalLoserScore = Math.max(MIN_SCORE, proposedLoserScore);

  return {
    winnerChange: finalWinnerScore - winner.score,
    loserChange: finalLoserScore - loser.score,
  };
}

/**
 * Scheduled function to process votes every 5 minutes
 * Aggregates all unprocessed votes and updates profile scores in batch
 */
export const processVotes = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('Starting vote processing...');

    try {
      // 1. Get all unprocessed votes
      const votesSnapshot = await db
        .collection('votes')
        .where('processed', '==', false)
        .get();

      if (votesSnapshot.empty) {
        console.log('No unprocessed votes found.');
        return null;
      }

      console.log(`Processing ${votesSnapshot.size} votes...`);

      // 2. Get all affected profile IDs
      const profileIds = new Set<string>();
      votesSnapshot.forEach(doc => {
        const vote = doc.data();
        profileIds.add(vote.winnerId);
        profileIds.add(vote.loserId);
      });

      // 3. Fetch all affected profiles at current state
      const profilesMap = new Map<string, Profile>();
      const profilePromises = Array.from(profileIds).map(async (id) => {
        const profileDoc = await db.collection('profiles').doc(id).get();
        if (profileDoc.exists) {
          const data = profileDoc.data()!;
          profilesMap.set(id, {
            score: data.score || 1000,
            voteCount: data.voteCount || 0,
          });
        }
      });
      await Promise.all(profilePromises);

      // 4. Calculate aggregated changes for each profile
      const scoreDeltas = new Map<string, number>();
      const voteCountDeltas = new Map<string, number>();

      votesSnapshot.forEach(doc => {
        const vote = doc.data();
        const { winnerId, loserId } = vote;

        const winner = profilesMap.get(winnerId);
        const loser = profilesMap.get(loserId);

        if (!winner || !loser) {
          console.warn(`Missing profile for vote ${doc.id}: winner=${winnerId}, loser=${loserId}`);
          return;
        }

        // Calculate score change for this vote
        const { winnerChange, loserChange } = calculateScoreChange(winner, loser);

        // Aggregate changes
        scoreDeltas.set(winnerId, (scoreDeltas.get(winnerId) || 0) + winnerChange);
        scoreDeltas.set(loserId, (scoreDeltas.get(loserId) || 0) + loserChange);
        voteCountDeltas.set(winnerId, (voteCountDeltas.get(winnerId) || 0) + 1);
        voteCountDeltas.set(loserId, (voteCountDeltas.get(loserId) || 0) + 1);

        // Update profile state for next iteration (since we process votes sequentially)
        winner.score += winnerChange;
        winner.voteCount += 1;
        loser.score += loserChange;
        loser.voteCount += 1;
      });

      // 5. Batch update all profiles
      const batch = db.batch();
      for (const [profileId, scoreDelta] of scoreDeltas) {
        const profileRef = db.collection('profiles').doc(profileId);
        batch.update(profileRef, {
          score: admin.firestore.FieldValue.increment(scoreDelta),
          voteCount: admin.firestore.FieldValue.increment(voteCountDeltas.get(profileId) || 0),
        });
      }
      await batch.commit();

      console.log(`Updated ${scoreDeltas.size} profiles`);

      // 6. Mark all votes as processed
      const processedBatch = db.batch();
      votesSnapshot.forEach(doc => {
        processedBatch.update(doc.ref, { processed: true });
      });
      await processedBatch.commit();

      console.log(`Marked ${votesSnapshot.size} votes as processed`);
      console.log('Vote processing complete!');

      return null;
    } catch (error) {
      console.error('Error processing votes:', error);
      throw error;
    }
  });
