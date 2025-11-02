import { useEffect, useState, useContext } from 'react';
import { auth } from '../services/auth';
import { AuthContext } from '../contexts/AuthContext';

const useAuth = () => {
    const { user, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setUser]);

    const signInWithGoogle = async () => {
        const provider = new auth.GoogleAuthProvider();
        try {
            const result = await auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error("Error signing in with Google: ", error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Error signing out: ", error);
            throw error;
        }
    };

    return {
        user,
        loading,
        signInWithGoogle,
        signOut,
    };
};

export default useAuth;