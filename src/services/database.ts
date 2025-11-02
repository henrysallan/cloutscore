import { db } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, increment } from 'firebase/firestore';

// Fetch all profiles from the Firestore database
export const fetchProfiles = async () => {
    const profilesCollection = collection(db, 'profiles');
    const profileSnapshot = await getDocs(profilesCollection);
    const profilesList = profileSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return profilesList;
};

// Update the score of a specific profile
export const updateProfileScore = async (profileId, scoreChange) => {
    const profileRef = doc(db, 'profiles', profileId);
    await updateDoc(profileRef, {
        score: increment(scoreChange)
    });
};

// Create a new profile in the Firestore database
export const createProfile = async (userId, name, initialScore = 1000) => {
    const profileRef = doc(db, 'profiles', userId);
    await setDoc(profileRef, {
        name,
        score: initialScore,
        voteCount: 0
    });
};

// Fetch votes from the Firestore database
export const fetchVotes = async () => {
    const votesCollection = collection(db, 'votes');
    const votesSnapshot = await getDocs(votesCollection);
    const votesList = votesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return votesList;
};

// Add a new vote to the Firestore database
export const addVote = async (winnerId, loserId) => {
    const voteRef = doc(collection(db, 'votes'));
    await setDoc(voteRef, {
        winnerId,
        loserId,
        timestamp: new Date().toISOString()
    });
};