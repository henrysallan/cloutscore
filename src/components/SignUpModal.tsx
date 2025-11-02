import React, { useState } from 'react';
import { auth } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

const SignUpModal: React.FC = () => {
    const { user, setUser } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async () => {
        try {
            const newUser = await auth.signInWithGoogle();
            if (newUser) {
                // Assuming a function to create a user profile in the database
                await createUserProfile(newUser.user.uid, firstName, lastName);
                setUser(newUser.user);
            }
        } catch (err) {
            setError('Failed to sign up. Please try again.');
        }
    };

    const createUserProfile = async (uid: string, firstName: string, lastName: string) => {
        // Logic to create user profile in the database
    };

    return (
        <div className="modal">
            <h2>Sign Up</h2>
            {error && <p className="error">{error}</p>}
            <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
            />
            <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
            />
            <button onClick={handleSignUp}>Sign Up with Google</button>
        </div>
    );
};

export default SignUpModal;