// src/components/SettingsModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadProfileImage } from '../services/storage';
import { updateProfileImage } from '../services/database';

interface SettingsModalProps {
  onClose: () => void;
}

function SettingsModal({ onClose }: SettingsModalProps) {
  const { user, profile, signOutUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      const url = await uploadProfileImage(selectedFile, user.uid);
      await updateProfileImage(user.uid, url);
      alert('Photo updated!');
      onClose();
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      onClose();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (!profile) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        
        {profile.imageUrl && (
          <div className="current-photo">
            <img src={profile.imageUrl} alt={profile.firstName} />
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Upload New Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={uploading || !selectedFile} className="btn-primary">
              {uploading ? 'Uploading...' : 'Save'}
            </button>
          </div>
        </form>
        
        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button type="button" onClick={handleSignOut} className="btn-danger" style={{ flex: 1 }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
