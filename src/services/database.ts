// src/services/database.ts
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { UserProfile, Vote } from '../types';
import { INITIAL_SCORE, RANKINGS_INITIAL_LOAD } from '../utils/constants';

/**
 * Fetch all profiles from Firestore
 */
export async function fetchAllProfiles(): Promise<UserProfile[]> {
  try {
    const profilesCollection = collection(db, 'profiles');
    const profileSnapshot = await getDocs(profilesCollection);
    
    return profileSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    })) as UserProfile[];
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
}

/**
 * Fetch a single profile by ID
 */
export async function fetchProfileById(profileId: string): Promise<UserProfile | null> {
  try {
    const profileRef = doc(db, 'profiles', profileId);
    const profileDoc = await getDoc(profileRef);
    
    if (!profileDoc.exists()) {
      return null;
    }
    
    return {
      id: profileDoc.id,
      ...profileDoc.data(),
      createdAt: (profileDoc.data().createdAt as Timestamp)?.toDate() || new Date(),
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

/**
 * Get random profiles for voting (excluding current user)
 */
export async function getRandomProfiles(
  excludeUserId?: string,
  count: number = 2
): Promise<UserProfile[]> {
  try {
    const allProfiles = await fetchAllProfiles();
    
    // Filter out current user
    const availableProfiles = excludeUserId
      ? allProfiles.filter(p => p.id !== excludeUserId)
      : allProfiles;
    
    if (availableProfiles.length < count) {
      throw new Error(`Not enough profiles. Need at least ${count} profiles.`);
    }
    
    // Shuffle and take requested count
    const shuffled = availableProfiles.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('Error getting random profiles:', error);
    throw error;
  }
}

/**
 * Create a new profile (called after Google sign-in)
 */
export async function createProfile(
  userId: string,
  firstName: string,
  lastName: string,
  imageUrl: string,
  isAuthUser: boolean = true
): Promise<UserProfile> {
  try {
    const profileRef = doc(db, 'profiles', userId);
    
    const newProfile: Omit<UserProfile, 'id' | 'createdAt'> & { createdAt: any } = {
      firstName,
      lastName,
      score: INITIAL_SCORE,
      imageUrl,
      voteCount: 0,
      isAuthUser,
      createdAt: serverTimestamp(),
    };
    
    await setDoc(profileRef, newProfile);
    
    return {
      id: userId,
      ...newProfile,
      createdAt: new Date(),
    } as UserProfile;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

/**
 * Update profile image URL
 */
export async function updateProfileImage(userId: string, imageUrl: string): Promise<void> {
  try {
    const profileRef = doc(db, 'profiles', userId);
    await setDoc(profileRef, { imageUrl }, { merge: true });
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw error;
  }
}

/**
 * Add a vote (write-append pattern - NO direct score updates)
 */
export async function addVote(
  winnerId: string,
  loserId: string,
  voterId: string
): Promise<void> {
  try {
    const voteData: Omit<Vote, 'id'> = {
      winnerId,
      loserId,
      voterId,
      timestamp: new Date(),
      processed: false,
    };
    
    await addDoc(collection(db, 'votes'), {
      ...voteData,
      timestamp: serverTimestamp(),
    });
    
    console.log(`Vote recorded: ${winnerId} beat ${loserId}`);
  } catch (error) {
    console.error('Error adding vote:', error);
    throw error;
  }
}

/**
 * Fetch top rankings with pagination
 */
export async function fetchRankings(
  lastDocument?: DocumentSnapshot,
  limitCount: number = RANKINGS_INITIAL_LOAD
): Promise<{ profiles: UserProfile[]; lastDoc: DocumentSnapshot | null }> {
  try {
    let q = query(
      collection(db, 'profiles'),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    
    if (lastDocument) {
      q = query(
        collection(db, 'profiles'),
        orderBy('score', 'desc'),
        startAfter(lastDocument),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    
    const profiles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    })) as UserProfile[];
    
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    
    return { profiles, lastDoc };
  } catch (error) {
    console.error('Error fetching rankings:', error);
    throw error;
  }
}

/**
 * Check if user has already voted on a specific matchup today (spam prevention)
 * Optional: can be used to prevent users from voting on same pair multiple times
 */
export async function hasVotedRecently(
  voterId: string,
  winnerId: string,
  loserId: string,
  withinMinutes: number = 5
): Promise<boolean> {
  try {
    const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);
    
    const q = query(
      collection(db, 'votes'),
      where('voterId', '==', voterId),
      where('timestamp', '>', cutoffTime)
    );
    
    const snapshot = await getDocs(q);
    
    // Check if any recent vote matches this exact matchup
    return snapshot.docs.some(doc => {
      const vote = doc.data();
      return (
        (vote.winnerId === winnerId && vote.loserId === loserId) ||
        (vote.winnerId === loserId && vote.loserId === winnerId)
      );
    });
  } catch (error) {
    console.error('Error checking recent votes:', error);
    return false; // Fail open - allow vote if check fails
  }
}
