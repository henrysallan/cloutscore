// src/contexts/VotingContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VotingPair, UserProfile } from '../types';
import { getRandomProfiles, addVote } from '../services/database';
import { calculateBothOutcomes } from '../utils/scoring';
import { PREFETCH_COUNT } from '../utils/constants';
import { useAuth } from './AuthContext';

interface VotingContextType {
  currentPair: VotingPair | null;
  loading: boolean;
  vote: (winnerId: string, loserId: string) => Promise<void>;
  skip: () => void;
  prefetchCount: number;
}

const VotingContext = createContext<VotingContextType | undefined>(undefined);

export function VotingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [queue, setQueue] = useState<VotingPair[]>([]);
  const [currentPair, setCurrentPair] = useState<VotingPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  /**
   * Create a voting pair with pre-calculated outcomes
   */
  const createVotingPair = useCallback(async (
    profiles: UserProfile[]
  ): Promise<VotingPair | null> => {
    if (profiles.length < 2) return null;

    const [profileA, profileB] = profiles;

    // Calculate both possible outcomes
    const { outcomeA, outcomeB } = calculateBothOutcomes(profileA, profileB);

    return {
      profileA,
      profileB,
      outcomeA, // If A wins
      outcomeB, // If B wins
    };
  }, []);

  /**
   * Pre-fetch pairs to fill the queue
   */
  const prefetchPairs = useCallback(async () => {
    if (isFetching) return;
    if (queue.length >= PREFETCH_COUNT) return;

    setIsFetching(true);

    try {
      const pairsNeeded = PREFETCH_COUNT - queue.length;
      const newPairs: VotingPair[] = [];

      for (let i = 0; i < pairsNeeded; i++) {
        // Get random profiles (do NOT exclude current user - they can vote on anyone)
        const profiles = await getRandomProfiles(undefined, 2);
        const pair = await createVotingPair(profiles);

        if (pair) {
          newPairs.push(pair);
        }
      }

      setQueue(prev => [...prev, ...newPairs]);
    } catch (error) {
      console.error('Error pre-fetching pairs:', error);
    } finally {
      setIsFetching(false);
    }
  }, [user, queue.length, isFetching, createVotingPair]);

  /**
   * Load next pair from queue
   */
  const loadNextPair = useCallback(() => {
    if (queue.length > 0) {
      const [nextPair, ...remainingQueue] = queue;
      setCurrentPair(nextPair);
      setQueue(remainingQueue);

      // Start pre-fetching more pairs in background
      if (remainingQueue.length < PREFETCH_COUNT / 2) {
        prefetchPairs();
      }
    } else {
      // Queue is empty, need to fetch immediately
      setCurrentPair(null);
      prefetchPairs();
    }
  }, [queue, prefetchPairs]);

  /**
   * Handle vote submission
   */
  const vote = useCallback(async (winnerId: string, loserId: string) => {
    if (!user) {
      throw new Error('Must be logged in to vote');
    }

    try {
      // Write vote to Firestore (write-append pattern)
      await addVote(winnerId, loserId, user.uid);

      // Load next pair immediately (already pre-calculated)
      loadNextPair();
    } catch (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
  }, [user, loadNextPair]);

  /**
   * Skip current pair without voting
   */
  const skip = useCallback(() => {
    loadNextPair();
  }, [loadNextPair]);

  /**
   * Initialize on mount and when user changes
   */
  useEffect(() => {
    async function initialize() {
      setLoading(true);
      try {
        // Pre-fetch initial pairs
        await prefetchPairs();
        
        // Load first pair
        if (queue.length > 0) {
          loadNextPair();
        }
      } catch (error) {
        console.error('Error initializing voting:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      initialize();
    }
  }, [user]); // Only run when user changes

  /**
   * Load first pair when queue is populated
   */
  useEffect(() => {
    if (!currentPair && queue.length > 0 && !loading) {
      loadNextPair();
    }
  }, [queue, currentPair, loading, loadNextPair]);

  return (
    <VotingContext.Provider
      value={{
        currentPair,
        loading,
        vote,
        skip,
        prefetchCount: queue.length,
      }}
    >
      {children}
    </VotingContext.Provider>
  );
}

export function useVoting() {
  const context = useContext(VotingContext);
  if (context === undefined) {
    throw new Error('useVoting must be used within a VotingProvider');
  }
  return context;
}
