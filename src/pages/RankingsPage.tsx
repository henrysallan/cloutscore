import React, { useEffect, useState } from 'react';
import { getProfiles } from '../services/database';
import RankingList from '../components/RankingList';

const RankingsPage: React.FC = () => {
    const [profiles, setProfiles] = useState<any[]>([]);
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
            <RankingList profiles={profiles} />
        </div>
    );
};

export default RankingsPage;