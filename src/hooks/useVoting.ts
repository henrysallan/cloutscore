import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { useProfiles } from './useProfiles';

const useVoting = () => {
    const [votingPair, setVotingPair] = useState([]);
    const [loading, setLoading] = useState(true);
    const { profiles } = useProfiles();

    useEffect(() => {
        if (profiles.length > 1) {
            selectRandomPair();
        }
    }, [profiles]);

    const selectRandomPair = () => {
        const shuffledProfiles = [...profiles].sort(() => 0.5 - Math.random());
        setVotingPair(shuffledProfiles.slice(0, 2));
        setLoading(false);
    };

    const handleVote = async (winnerId, loserId) => {
        const winner = profiles.find(profile => profile.id === winnerId);
        const loser = profiles.find(profile => profile.id === loserId);

        const winnerScoreChange = calculateScoreChange(winner, loser);
        const loserScoreChange = -winnerScoreChange;

        await addVoteToDatabase(winnerId, loserId);
        updateScores(winnerId, winnerScoreChange);
        updateScores(loserId, loserScoreChange);

        selectRandomPair();
    };

    const calculateScoreChange = (winner, loser) => {
        const scoreDifference = winner.score - loser.score;
        const baseChange = scoreDifference > 0 ? 5 : 10; // Example base change
        const adjustmentFactor = Math.max(1, Math.log10(winner.voteCount + 1)); // Adjust based on vote count
        return Math.round(baseChange * adjustmentFactor);
    };

    const addVoteToDatabase = async (winnerId, loserId) => {
        try {
            await addDoc(collection(db, 'votes'), {
                winnerId,
                loserId,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error("Error adding vote: ", error);
        }
    };

    const updateScores = async (profileId, scoreChange) => {
        // Logic to update the profile score in the database
        // This function would typically call a service function to update the Firestore document
    };

    return {
        votingPair,
        loading,
        handleVote,
    };
};

export default useVoting;