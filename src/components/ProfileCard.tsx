// src/components/ProfileCard.tsx
import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { getCachedScore } from '../utils/scoreCache';

interface ProfileCardProps {
  profile: UserProfile;
  potentialChange: number;
  onClick: () => void;
  disabled?: boolean;
  showChange?: boolean;
  isWinner?: boolean;
  optimisticScore?: number;
}

function ProfileCard({ 
  profile, 
  potentialChange, 
  onClick, 
  disabled = false,
  showChange = false,
  isWinner = false,
  optimisticScore
}: ProfileCardProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const changePrefix = potentialChange >= 0 ? '+' : '';
  const changeClass = potentialChange >= 0 ? 'positive' : 'negative';
  
  // Initialize with cached score if available, otherwise use profile score
  const [displayScore, setDisplayScore] = useState(() => {
    const cached = getCachedScore(profile.id);
    return cached !== null ? cached : profile.score;
  });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (optimisticScore !== undefined && optimisticScore !== displayScore) {
      setIsAnimating(true);
      const start = displayScore;
      const end = optimisticScore;
      const duration = 800; // Animation duration in ms
      const steps = 30;
      const increment = (end - start) / steps;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayScore(end);
          setIsAnimating(false);
          clearInterval(interval);
        } else {
          setDisplayScore(Math.round(start + (increment * currentStep)));
        }
      }, stepDuration);
      
      return () => clearInterval(interval);
    }
  }, [optimisticScore, displayScore]);

  return (
    <div 
      className={`profile-card ${disabled ? 'disabled' : ''} ${showChange && isWinner ? 'winner-flash' : ''}`}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyPress={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    >
      <img 
        src={profile.imageUrl || '/default-avatar.png'} 
        alt={fullName} 
        className="profile-image" 
      />
      
      {showChange && (
        <div className={`score-change-overlay ${changeClass} animate-in`}>
          {changePrefix}{potentialChange}
        </div>
      )}
      
      <div className="profile-info">
        <div className="profile-name">{fullName}</div>
        <div className={`profile-score ${isAnimating ? 'score-animating' : ''}`}>
          {displayScore}
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;
