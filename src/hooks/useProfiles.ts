import { useEffect, useState } from 'react';
import { getProfiles } from '../services/database';
import { Profile } from '../types';

const useProfiles = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                setLoading(true);
                const fetchedProfiles = await getProfiles();
                setProfiles(fetchedProfiles);
            } catch (err) {
                setError('Failed to fetch profiles');
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, []);

    return { profiles, loading, error };
};

export default useProfiles;