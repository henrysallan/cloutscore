"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVotes = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// Constants matching client-side
const MIN_SCORE = 100;
const NEW_PROFILE_CHANGE = 100;
const ESTABLISHED_PROFILE_CHANGE = 1;
const ESTABLISHED_THRESHOLD = 100;
/**
 * Calculate score changes using modified Elo formula
 */
function calculateScoreChange(winner, loser) {
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
exports.processVotes = functions.pubsub
    .schedule('every 5 minutes')
    .onRun((context) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Starting vote processing...');
    try {
        // 1. Get all unprocessed votes
        const votesSnapshot = yield db
            .collection('votes')
            .where('processed', '==', false)
            .get();
        if (votesSnapshot.empty) {
            console.log('No unprocessed votes found.');
            return null;
        }
        console.log(`Processing ${votesSnapshot.size} votes...`);
        // 2. Get all affected profile IDs
        const profileIds = new Set();
        votesSnapshot.forEach(doc => {
            const vote = doc.data();
            profileIds.add(vote.winnerId);
            profileIds.add(vote.loserId);
        });
        // 3. Fetch all affected profiles at current state
        const profilesMap = new Map();
        const profilePromises = Array.from(profileIds).map((id) => __awaiter(void 0, void 0, void 0, function* () {
            const profileDoc = yield db.collection('profiles').doc(id).get();
            if (profileDoc.exists) {
                const data = profileDoc.data();
                profilesMap.set(id, {
                    score: data.score || 1000,
                    voteCount: data.voteCount || 0,
                });
            }
        }));
        yield Promise.all(profilePromises);
        // 4. Calculate aggregated changes for each profile
        const scoreDeltas = new Map();
        const voteCountDeltas = new Map();
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
        yield batch.commit();
        console.log(`Updated ${scoreDeltas.size} profiles`);
        // 6. Mark all votes as processed
        const processedBatch = db.batch();
        votesSnapshot.forEach(doc => {
            processedBatch.update(doc.ref, { processed: true });
        });
        yield processedBatch.commit();
        console.log(`Marked ${votesSnapshot.size} votes as processed`);
        console.log('Vote processing complete!');
        return null;
    }
    catch (error) {
        console.error('Error processing votes:', error);
        throw error;
    }
}));
