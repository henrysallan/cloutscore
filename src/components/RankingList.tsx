// src/components/RankingList.tsx
import React from 'react';
import { UserProfile } from '../types';
import { getCachedScore } from '../utils/scoreCache';

interface RankingListProps {
  profiles: UserProfile[];
}

function RankingList({ profiles }: RankingListProps) {
  if (profiles.length === 0) {
    return (
      <div className="loading">
        No profiles yet. Be the first to join!
      </div>
    );
  }

  // Create profiles with cached scores where available
  const profilesWithCachedScores = profiles.map(profile => {
    const cachedScore = getCachedScore(profile.id);
    return {
      ...profile,
      displayScore: cachedScore !== null ? cachedScore : profile.score
    };
  });

  // Re-sort by display score
  const sortedProfiles = [...profilesWithCachedScores].sort((a, b) => b.displayScore - a.displayScore);

  return (
    <div className="rankings-list">
      {sortedProfiles.map((profile, index) => {
        const fullName = `${profile.firstName} ${profile.lastName}`.trim();
        
        return (
          <div key={profile.id} className="ranking-card">
            <div className="rank-number">#{index + 1}</div>
            <img 
              src={profile.imageUrl || '/default-avatar.png'} 
              alt={fullName}
              className="ranking-image"
            />
            <div className="ranking-info">
              <div className="ranking-name">{fullName}</div>
              <div className="ranking-score">{profile.displayScore}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RankingList;
