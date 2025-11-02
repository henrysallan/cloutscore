import React, { useEffect, useState } from 'react';
import { Profile } from '../types';
import { useVoting } from '../hooks/useVoting';
import ProfileCard from './ProfileCard';

const VotingPair: React.FC = () => {
    const { getRandomProfiles, voteOnProfile } = useVoting();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            const randomProfiles = await getRandomProfiles();
            setProfiles(randomProfiles);
            setLoading(false);
        };

        fetchProfiles();
    }, [getRandomProfiles]);

    const handleVote = async (winnerId: string, loserId: string) => {
        await voteOnProfile(winnerId, loserId);
        const newProfiles = await getRandomProfiles();
        setProfiles(newProfiles);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="voting-pair">
            <ProfileCard
                profile={profiles[0]}
                onVote={() => handleVote(profiles[0].id, profiles[1].id)}
            />
            <ProfileCard
                profile={profiles[1]}
                onVote={() => handleVote(profiles[1].id, profiles[0].id)}
            />
        </div>
    );
};

export default VotingPair;