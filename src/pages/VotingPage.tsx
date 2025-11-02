import React, { useEffect, useState } from 'react';
import { useProfiles } from '../hooks/useProfiles';
import { useVoting } from '../hooks/useVoting';
import VotingPair from '../components/VotingPair';
import { Profile } from '../types';

const VotingPage: React.FC = () => {
    const { profiles, fetchRandomProfiles } = useProfiles();
    const { currentPair, updateVote } = useVoting();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProfiles = async () => {
            await fetchRandomProfiles();
            setLoading(false);
        };
        loadProfiles();
    }, [fetchRandomProfiles]);

    const handleVote = (winnerId: string, loserId: string) => {
        updateVote(winnerId, loserId);
        fetchRandomProfiles();
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="voting-page">
            {currentPair && (
                <VotingPair
                    profileA={currentPair[0]}
                    profileB={currentPair[1]}
                    onVote={handleVote}
                />
            )}
        </div>
    );
};

export default VotingPage;