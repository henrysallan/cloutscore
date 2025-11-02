// src/pages/RankingsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { fetchRankings } from '../services/database';
import { UserProfile } from '../types';
import { DocumentSnapshot } from 'firebase/firestore';
import RankingList from '../components/RankingList';

function RankingsPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Initial load
  useEffect(() => {
    async function loadInitial() {
      try {
        const { profiles: initialProfiles, lastDoc } = await fetchRankings();
        setProfiles(initialProfiles);
        setLastDoc(lastDoc);
        setHasMore(initialProfiles.length > 0);
      } catch (error) {
        console.error('Error loading rankings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, []);

  // Load more profiles
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      const { profiles: moreProfiles, lastDoc: newLastDoc } = await fetchRankings(lastDoc);
      
      if (moreProfiles.length === 0) {
        setHasMore(false);
      } else {
        setProfiles(prev => [...prev, ...moreProfiles]);
        setLastDoc(newLastDoc);
      }
    } catch (error) {
      console.error('Error loading more rankings:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [lastDoc, loadingMore, hasMore]);

  // Infinite scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;

    if (bottom && hasMore && !loadingMore) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore]);

  if (loading) {
    return (
      <div className="rankings-container">
        <div className="loading">Loading rankings...</div>
      </div>
    );
  }

  return (
    <div className="rankings-container" onScroll={handleScroll}>
      <h1 className="rankings-title">Rankings</h1>
      <RankingList profiles={profiles} />
      {loadingMore && <div className="loading">Loading more...</div>}
      {!hasMore && profiles.length > 0 && (
        <div className="loading">End of rankings</div>
      )}
    </div>
  );
}

export default RankingsPage;
