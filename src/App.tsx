import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import VotingPage from './pages/VotingPage';
import RankingsPage from './pages/RankingsPage';
import SettingsModal from './components/SettingsModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VotingProvider } from './contexts/VotingContext';
import { clearExpiredScores } from './utils/scoreCache';
import './index.css';

function AppContent() {
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Clear expired cached scores on mount
  useEffect(() => {
    clearExpiredScores();
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <div className="app-header">
        <div style={{ width: '29px' }} /> {/* Spacer for center alignment */}
        <h1 className="site-title">cloutscore</h1>
        {user && (
          <button 
            className="settings-button"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            ⚙
          </button>
        )}
        {!user && <div style={{ width: '29px' }} />}
      </div>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<VotingPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
        </Routes>
      </main>

      {/* Bottom Tab Navigation */}
      <div className="bottom-tabs">
        <Link 
          to="/" 
          className={`tab ${location.pathname === '/' ? 'active' : ''}`}
        >
          Clout Tab
        </Link>
        <Link 
          to="/rankings" 
          className={`tab ${location.pathname === '/rankings' ? 'active' : ''}`}
        >
          Rankings
        </Link>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <VotingProvider>
        <Router>
          <AppContent />
        </Router>
      </VotingProvider>
    </AuthProvider>
  );
}

export default App;
