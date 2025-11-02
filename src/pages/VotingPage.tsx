// src/pages/VotingPage.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useVoting } from '../contexts/VotingContext';
import VotingPair from '../components/VotingPair';

function VotingPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { currentPair, loading: votingLoading } = useVoting();

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="voting-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="auth-prompt">
        <h2>Sign in to start voting</h2>
        <p>Vote on profiles and see who rises to the top!</p>
        <button onClick={signIn}>
          Sign in with Google
        </button>
      </div>
    );
  }

  // Show loading while fetching profiles
  if (votingLoading || !currentPair) {
    return (
      <div className="voting-container">
        <div className="loading">Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="voting-container">
      <div className="voting-title">
        <div className="voting-title-line1">who has more</div>
        <div className="voting-title-line2">clout?</div>
      </div>
      <VotingPair />
    </div>
  );
}

export default VotingPage;
