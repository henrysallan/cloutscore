// src/types/index.ts

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    score: number;
    imageUrl: string;
    voteCount: number;
}

export interface Vote {
    winnerId: string;
    loserId: string;
    timestamp: Date;
}

export interface AuthUser {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
}

export interface Ranking {
    rank: number;
    profile: UserProfile;
}