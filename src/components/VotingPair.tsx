// src/components/VotingPair.tsx
import React, { useState } from 'react';
import { useVoting } from '../contexts/VotingContext';
import ProfileCard from './ProfileCard';
import { setCachedScore } from '../utils/scoreCache';

function VotingPair() {
  const { currentPair, vote, skip } = useVoting();
  const [isVoting, setIsVoting] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [optimisticScores, setOptimisticScores] = useState<{[key: string]: number}>({});

  if (!currentPair) {
    return <div className="loading">Loading next pair...</div>;
  }

  const { profileA, profileB, outcomeA, outcomeB } = currentPair;

  const handleVote = async (winnerId: string, loserId: string) => {
    if (isVoting) return;

    setIsVoting(true);
    setSelectedWinner(winnerId);
    
    // Calculate optimistic scores
    const winnerChange = winnerId === profileA.id ? outcomeA.winnerChange : outcomeB.winnerChange;
    const loserChange = loserId === profileA.id ? outcomeA.loserChange : outcomeB.loserChange;
    
    const newWinnerScore = (winnerId === profileA.id ? profileA.score : profileB.score) + winnerChange;
    const newLoserScore = (loserId === profileA.id ? profileA.score : profileB.score) + loserChange;
    
    // Set optimistic scores after a brief delay to show the change numbers first
    setTimeout(() => {
      setOptimisticScores({
        [winnerId]: newWinnerScore,
        [loserId]: newLoserScore,
      });
      
      // Cache the optimistic scores in localStorage
      setCachedScore(winnerId, newWinnerScore);
      setCachedScore(loserId, newLoserScore);
    }, 300);
    
    // Show animation for a brief moment before transitioning
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    try {
      await vote(winnerId, loserId);
      setSelectedWinner(null);
      setOptimisticScores({});
    } catch (error) {
      console.error('Vote failed:', error);
      alert('Failed to submit vote. Please try again.');
      setSelectedWinner(null);
      setOptimisticScores({});
      setIsVoting(false);
    }
  };

  const handleSkip = () => {
    if (isVoting) return;
    skip();
  };

  return (
    <>
      <div className="voting-pair">
        <ProfileCard
          profile={profileA}
          potentialChange={selectedWinner === profileA.id ? outcomeA.winnerChange : outcomeA.loserChange}
          onClick={() => handleVote(profileA.id, profileB.id)}
          disabled={isVoting}
          showChange={selectedWinner !== null}
          isWinner={selectedWinner === profileA.id}
          optimisticScore={optimisticScores[profileA.id]}
        />

        <ProfileCard
          profile={profileB}
          potentialChange={selectedWinner === profileB.id ? outcomeB.winnerChange : outcomeB.loserChange}
          onClick={() => handleVote(profileB.id, profileA.id)}
          disabled={isVoting}
          showChange={selectedWinner !== null}
          isWinner={selectedWinner === profileB.id}
          optimisticScore={optimisticScores[profileB.id]}
        />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={handleSkip} className="skip-button" disabled={isVoting}>
          Skip This Pair
        </button>
      </div>
    </>
  );
}

export default VotingPair;
