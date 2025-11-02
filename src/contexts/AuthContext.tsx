// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOut, onAuthChange } from '../services/auth';
import { createProfile, fetchProfileById } from '../services/database';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Check if profile exists, create if not
        try {
          let userProfile = await fetchProfileById(firebaseUser.uid);

          if (!userProfile) {
            // Create profile from Google account data
            const displayName = firebaseUser.displayName || 'User';
            const [firstName, ...lastNameParts] = displayName.split(' ');
            const lastName = lastNameParts.join(' ') || '';

            userProfile = await createProfile(
              firebaseUser.uid,
              firstName,
              lastName,
              firebaseUser.photoURL || '',
              true // isAuthUser
            );
          }

          setProfile(userProfile);
        } catch (error) {
          console.error('Error loading/creating profile:', error);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // Profile will be loaded by the onAuthChange listener
    } catch (error) {
      console.error('Sign in failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
