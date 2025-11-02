import React from 'react';

interface ProfileCardProps {
    profile: {
        id: string;
        name: string;
        score: number;
        imageUrl: string;
    };
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
    return (
        <div className="profile-card">
            <img src={profile.imageUrl} alt={profile.name} className="profile-image" />
            <div className="profile-info">
                <h3>{profile.name}</h3>
                <p>Score: {profile.score}</p>
            </div>
        </div>
    );
};

export default ProfileCard;