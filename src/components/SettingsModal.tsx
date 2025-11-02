import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { uploadProfilePhoto } from '../services/storage';

const SettingsModal = () => {
    const { user, updateUserProfile } = useAuth();
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePhotoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProfilePhoto(file);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            let photoURL = user.photoURL;
            if (profilePhoto) {
                photoURL = await uploadProfilePhoto(profilePhoto);
            }
            await updateUserProfile({ firstName, lastName, photoURL });
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-modal">
            <h2>Update Profile</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>First Name:</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Last Name:</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Profile Photo:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                </button>
            </form>
        </div>
    );
};

export default SettingsModal;