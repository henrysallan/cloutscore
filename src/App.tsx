import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import VotingPage from './pages/VotingPage';
import RankingsPage from './pages/RankingsPage';
import Navigation from './components/Navigation';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<VotingPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;