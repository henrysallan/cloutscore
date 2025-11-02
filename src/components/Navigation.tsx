// src/components/Navigation.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SettingsModal from './SettingsModal';

function Navigation() {
  const { user, profile, signIn, signOutUser } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <nav>
        <div className="nav-links">
          <Link to="/">Voting</Link>
          <Link to="/rankings">Rankings</Link>
        </div>

        <div className="auth-section">
          {user && profile ? (
            <>
              <div className="user-info">
                {profile.imageUrl && (
                  <img src={profile.imageUrl} alt={profile.firstName} className="user-avatar" />
                )}
                <span className="user-name">
                  {profile.firstName} {profile.lastName}
                </span>
              </div>
              <button 
                onClick={() => setShowSettings(true)}
                className="btn-secondary"
              >
                Settings
              </button>
              <button onClick={signOutUser} className="btn-danger">
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={signIn} className="btn-primary">
              Sign In with Google
            </button>
          )}
        </div>
      </nav>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}

export default Navigation;
