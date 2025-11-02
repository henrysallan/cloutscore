import React, { useEffect, useState } from 'react';
import { getProfiles } from '../services/database';
import { Profile } from '../types';

const RankingList: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            const fetchedProfiles = await getProfiles();
            setProfiles(fetchedProfiles);
            setLoading(false);
        };

        fetchProfiles();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Rankings</h1>
            <ul>
                {profiles.map((profile, index) => (
                    <li key={profile.id}>
                        {index + 1}. {profile.name} - Score: {profile.score}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RankingList;