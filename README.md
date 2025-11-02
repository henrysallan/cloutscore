# Cloutscore - Social Scoring System Web Application

## Overview

Cloutscore is a social scoring web app where users vote on profile pairs to influence rankings. Built with React + Vite + Firebase, it features instant-feedback voting with zero perceived lag through pre-fetching, a modified Elo scoring system that favors new profiles with high volatility, and Google authentication for profile creation.

## Core Concept

Users see two profiles side-by-side and choose one. Each vote adjusts both profiles' scores based on:
- **Score difference** (Elo upset calculations)
- **Vote count history** (new profiles swing wildly, established profiles change slowly)
- **Write-append pattern** (no race conditions, Cloud Function batch processes every 5-30 min)

## Features

### Authentication & Profiles
- **Google Authentication**: One-click sign-in with Google
- **Auto Profile Creation**: Name and photo pulled from Google account
- **Profile Settings**: Upload custom profile photo (max 10MB, compressed to <1MB)
- **Vote-Only Profiles**: Admin can create profiles via Firestore (no auth required)

### Voting System
- **Side-by-Side Voting**: Two profiles, click one to vote
- **Zero-Lag Experience**: Pre-fetches 10 pairs with pre-calculated score changes
- **Auth-Required**: Unauthenticated users see Google auth when clicking to vote
- **Skip Button**: Users can skip pairs they don't want to vote on
- **Vote Tracking**: Tracks who voted to prevent spam (lightweight)
- **Self-Exclusion**: Users never see their own profile in voting pairs
- **Visual Feedback**: 
  - Animated +/- score changes float up
  - Slide-up transition to next pair
  - Instant UI updates before database write

### Scoring Algorithm
- **Starting Score**: 1000 points
- **Minimum Score**: 100 points (floor)
- **Volatility-Based Changes**:
  - **New profiles** (few votes): ±100 points per vote
  - **Established profiles** (many votes): ±1 point per vote
  - **Modified Elo**: Accounts for score difference AND vote count
- **Batch Processing**: Cloud Function runs every 5-30 minutes
- **Write-Append Pattern**: No race conditions, all votes logged independently

### Rankings
- **Top 100**: Initial load shows top 100 profiles
- **Infinite Scroll**: Load more as user scrolls down
- **Display**: Rank, Name, Score (no photos, no vote counts)
- **Refresh Required**: Manual refresh to update rankings

### Technical Features
- **React 18 + TypeScript**: Type-safe component architecture
- **Vite**: Lightning-fast dev server and builds
- **Firebase Firestore**: NoSQL database with security rules
- **Firebase Storage**: Compressed image hosting
- **Firebase Functions**: Serverless batch vote processing
- **Firebase Hosting**: CDN-backed static hosting
- **React Router 6**: Client-side routing
- **Context API**: Global state management (auth, voting queue)

## Project Structure

```
cloutscore
├── src
│   ├── components
│   ├── contexts
│   ├── hooks
│   ├── services
│   ├── utils
│   ├── pages
│   ├── types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── functions
│   ├── src
│   ├── package.json
│   └── tsconfig.json
├── public
│   └── vite.svg
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── firebase.json
├── .firebaserc
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (version 16 or higher)
- Firebase CLI: `npm install -g firebase-tools`
- Firebase account (already configured for this project)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/henrysallan/cloutscore.git
   cd cloutscore/cloutscore
   ```

2. Install dependencies:
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

3. Firebase is already configured for this project:
   - **Project ID**: `cloutscore-fb225`
   - **Firestore**: ✅ Enabled with security rules
   - **Storage**: ✅ Enabled with security rules
   - **Authentication**: Enable Google provider in [Firebase Console](https://console.firebase.google.com/project/cloutscore-fb225/authentication/providers)

4. Environment variables are already set up in `.env` file

### Running the Application Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173`

3. (Optional) Run Firebase emulators for local testing:
   ```bash
   firebase emulators:start
   ```

### Deploying to Firebase

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```bash
   firebase login
   ```

3. Deploy the application:
   ```bash
   firebase deploy
   ```

---

## Implementation Plan

### Phase 1: Core Infrastructure ✅
- [x] React + Vite project setup
- [x] Firebase configuration (Firestore, Auth, Storage, Functions)
- [x] TypeScript types for Profile, Vote, User
- [x] Project structure with components, hooks, services, utils
- [x] Firebase security rules deployed
- [x] Environment variables configured

### Phase 2: Authentication & Profiles
**Goal**: Users can sign in with Google and auto-create profiles

#### Components
- `AuthContext.tsx` - Global auth state provider
- `Navigation.tsx` - Sign in/out button, settings icon
- `SettingsModal.tsx` - Upload profile photo

#### Implementation Details
```typescript
// On Google Sign-In:
1. Authenticate with Firebase Auth
2. Check if profile exists in Firestore
3. If NOT exists:
   - Create profile document with:
     - id: user.uid
     - firstName: extract from displayName
     - lastName: extract from displayName
     - score: 1000 (INITIAL_SCORE)
     - imageUrl: user.photoURL (Google profile pic)
     - voteCount: 0
     - createdAt: timestamp
4. If exists, load existing profile
```

#### Settings Modal
```typescript
// Profile Photo Upload:
1. User selects image file (max 10MB, jpg/png/heic)
2. Compress image to <1MB using browser-image-compression
3. Upload to Firebase Storage: /profile_images/{userId}/{filename}
4. Get download URL
5. Update profile.imageUrl in Firestore
6. Update UI immediately
```

### Phase 3: Scoring Algorithm
**Goal**: Proper volatility-based scoring with modified Elo

#### Constants (`utils/constants.ts`)
```typescript
export const INITIAL_SCORE = 1000;
export const MIN_SCORE = 100;
export const MAX_SCORE = Infinity; // No upper limit
export const NEW_PROFILE_CHANGE = 100; // ±100 for new profiles
export const ESTABLISHED_PROFILE_CHANGE = 1; // ±1 for established
export const ESTABLISHED_THRESHOLD = 100; // votes needed to be "established"
export const PREFETCH_COUNT = 10; // pairs to pre-calculate
```

#### Scoring Formula (`utils/scoring.ts`)
```typescript
function calculateScoreChange(winner: Profile, loser: Profile): {
  winnerChange: number;
  loserChange: number;
} {
  // 1. Calculate base Elo expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (loser.score - winner.score) / 400));
  const expectedLoser = 1 - expectedWinner;
  
  // 2. Determine K-factor based on vote counts
  const winnerK = winner.voteCount < ESTABLISHED_THRESHOLD 
    ? NEW_PROFILE_CHANGE 
    : ESTABLISHED_PROFILE_CHANGE;
  const loserK = loser.voteCount < ESTABLISHED_THRESHOLD 
    ? NEW_PROFILE_CHANGE 
    : ESTABLISHED_PROFILE_CHANGE;
  
  // 3. Calculate changes
  const winnerChange = Math.round(winnerK * (1 - expectedWinner));
  const loserChange = Math.round(loserK * (0 - expectedLoser));
  
  // 4. Apply minimum score floor
  const finalWinnerScore = Math.max(MIN_SCORE, winner.score + winnerChange);
  const finalLoserScore = Math.max(MIN_SCORE, loser.score + loserChange);
  
  return {
    winnerChange: finalWinnerScore - winner.score,
    loserChange: finalLoserScore - loser.score
  };
}
```

### Phase 4: Vote Tracking (Write-Append Pattern)
**Goal**: No race conditions, all votes logged independently

#### Vote Document Structure
```typescript
{
  id: string;              // Auto-generated
  winnerId: string;        // Profile ID
  loserId: string;         // Profile ID
  voterId: string;         // User who voted (for spam prevention)
  timestamp: Timestamp;
  processed: false;        // Cloud Function sets to true after processing
}
```

#### Vote Flow
```typescript
// When user clicks a profile:
1. Immediately update UI with pre-calculated score changes
2. Write new vote document to Firestore (append-only)
   {
     winnerId: selectedProfile.id,
     loserId: otherProfile.id,
     voterId: currentUser.uid,
     timestamp: serverTimestamp(),
     processed: false
   }
3. Load next pre-fetched pair from queue
4. Start pre-fetching next pair in background

// NO direct profile score updates from client!
```

### Phase 5: Pre-Fetching System
**Goal**: Zero perceived lag between votes

#### Voting Context (`contexts/VotingContext.tsx`)
```typescript
interface VotingQueueItem {
  profileA: Profile;
  profileB: Profile;
  outcomeA: { winnerChange: number; loserChange: number }; // If A wins
  outcomeB: { winnerChange: number; loserChange: number }; // If B wins
}

const VotingContext = {
  currentPair: VotingQueueItem | null;
  queue: VotingQueueItem[]; // 10 pre-calculated pairs
  
  // Methods
  loadNextPair(): void;
  vote(winnerId: string, loserId: string): void;
  skip(): void;
  prefetchPairs(): void;
}
```

#### Pre-fetch Logic
```typescript
async function prefetchPairs() {
  while (queue.length < PREFETCH_COUNT) {
    // 1. Get 2 random profiles (excluding current user)
    const [profileA, profileB] = await getRandomProfiles(currentUser.uid);
    
    // 2. Calculate BOTH possible outcomes
    const outcomeA = calculateScoreChange(profileA, profileB); // A wins
    const outcomeB = calculateScoreChange(profileB, profileA); // B wins
    
    // 3. Add to queue
    queue.push({ profileA, profileB, outcomeA, outcomeB });
  }
}

// Start pre-fetching on mount and after each vote
useEffect(() => {
  prefetchPairs();
}, []);
```

### Phase 6: Voting Page UI
**Goal**: Smooth animations and instant feedback

#### Layout
```
┌─────────────────────────────────────┐
│  [Settings Icon]     [Skip Button]  │
├─────────────────────────────────────┤
│                                     │
│   ┌──────────┐   ┌──────────┐     │
│   │          │   │          │     │
│   │  Photo   │   │  Photo   │     │
│   │          │   │          │     │
│   ├──────────┤   ├──────────┤     │
│   │ Score    │   │ Score    │     │
│   │ +100     │   │ +1       │     │  <- Pre-calculated changes
│   └──────────┘   └──────────┘     │
│   (clickable)     (clickable)     │
│                                     │
└─────────────────────────────────────┘
```

#### Voting Animation Sequence
```typescript
1. User clicks Profile A
2. Show floating "+100" animation on A, "-50" on B
3. Update displayed scores immediately (optimistic UI)
4. Slide up transition (500ms)
5. Next pair appears instantly (already loaded)
6. Background: write vote to Firestore
7. Background: start pre-fetching next pair
```

### Phase 7: Rankings Page
**Goal**: Scrollable leaderboard with lazy loading

#### Implementation
```typescript
// Initial load: Top 100 profiles
const [profiles, setProfiles] = useState<Profile[]>([]);
const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
const [loading, setLoading] = useState(false);

// Firestore query
const q = query(
  collection(db, 'profiles'),
  orderBy('score', 'desc'),
  limit(100)
);

// Infinite scroll
function loadMore() {
  if (!lastDoc || loading) return;
  
  const nextQuery = query(
    collection(db, 'profiles'),
    orderBy('score', 'desc'),
    startAfter(lastDoc),
    limit(100)
  );
  
  // Fetch and append
}

// Display
return (
  <div onScroll={handleScroll}>
    {profiles.map((profile, index) => (
      <RankingItem
        rank={index + 1}
        name={`${profile.firstName} ${profile.lastName}`}
        score={profile.score}
      />
    ))}
  </div>
);
```

### Phase 8: Cloud Function (Batch Processing)
**Goal**: Efficiently process votes every 5-30 minutes

#### Function Logic (`functions/src/index.ts`)
```typescript
export const processVotes = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    
    // 1. Get all unprocessed votes
    const votesSnapshot = await db
      .collection('votes')
      .where('processed', '==', false)
      .get();
    
    if (votesSnapshot.empty) return null;
    
    // 2. Aggregate score changes per profile
    const updates: Map<string, { scoreDelta: number, voteCountDelta: number }> = new Map();
    
    for (const voteDoc of votesSnapshot.docs) {
      const vote = voteDoc.data();
      const { winnerId, loserId } = vote;
      
      // Get current profiles to calculate change
      const winnerDoc = await db.collection('profiles').doc(winnerId).get();
      const loserDoc = await db.collection('profiles').doc(loserId).get();
      
      if (!winnerDoc.exists || !loserDoc.exists) continue;
      
      const winner = winnerDoc.data();
      const loser = loserDoc.data();
      
      // Calculate score change with proper K-factor
      const { winnerChange, loserChange } = calculateScoreChange(winner, loser);
      
      // Aggregate changes
      if (!updates.has(winnerId)) {
        updates.set(winnerId, { scoreDelta: 0, voteCountDelta: 0 });
      }
      if (!updates.has(loserId)) {
        updates.set(loserId, { scoreDelta: 0, voteCountDelta: 0 });
      }
      
      updates.get(winnerId)!.scoreDelta += winnerChange;
      updates.get(winnerId)!.voteCountDelta += 1;
      updates.get(loserId)!.scoreDelta += loserChange;
      updates.get(loserId)!.voteCountDelta += 1;
    }
    
    // 3. Batch update all profiles
    const batch = db.batch();
    for (const [profileId, { scoreDelta, voteCountDelta }] of updates) {
      const profileRef = db.collection('profiles').doc(profileId);
      batch.update(profileRef, {
        score: FieldValue.increment(scoreDelta),
        voteCount: FieldValue.increment(voteCountDelta)
      });
    }
    await batch.commit();
    
    // 4. Mark all votes as processed
    const processedBatch = db.batch();
    votesSnapshot.forEach(doc => {
      processedBatch.update(doc.ref, { processed: true });
    });
    await processedBatch.commit();
    
    console.log(`Processed ${votesSnapshot.size} votes, updated ${updates.size} profiles`);
    return null;
  });
```

### Phase 9: Skip Button
**Goal**: Allow users to skip pairs without voting

```typescript
function handleSkip() {
  // 1. Don't write any vote
  // 2. Load next pair from queue
  // 3. Pre-fetch another pair in background
  loadNextPair();
  prefetchPairs();
}
```

### Phase 10: Image Compression
**Goal**: Compress uploaded photos to <1MB

#### Package
```bash
npm install browser-image-compression
```

#### Implementation
```typescript
import imageCompression from 'browser-image-compression';

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.9,           // Target <1MB
    maxWidthOrHeight: 1920,   // Max dimension
    useWebWorker: true,       // Performance
    fileType: 'image/jpeg'    // Convert HEIC to JPEG
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
}
```

### Phase 11: Auth-Required Voting
**Goal**: Prompt Google auth when unauthenticated user tries to vote

```typescript
function handleProfileClick(profileId: string) {
  if (!currentUser) {
    // Show Google sign-in popup
    signInWithPopup(auth, googleProvider)
      .then(() => {
        // After sign-in, allow vote
        vote(profileId);
      });
  } else {
    vote(profileId);
  }
}
```

### Phase 12: Dependency Updates
**Required updates for compatibility**

```bash
npm install react@^18.2.0 react-dom@^18.2.0
npm install react-router-dom@^6.20.0
npm install firebase@^10.7.0
npm install browser-image-compression@^2.0.2
npm install --save-dev @vitejs/plugin-react@^4.2.0
npm install --save-dev @types/react@^18.2.0
npm install --save-dev @types/react-dom@^18.2.0
```

---

## Data Models

### Firestore Collections

#### `profiles`
```typescript
{
  id: string;              // Firebase Auth UID
  firstName: string;       // From Google or manual
  lastName: string;
  score: number;           // Starts at 1000, min 100
  imageUrl: string;        // Firebase Storage URL or Google photo
  voteCount: number;       // Total votes received (for volatility calc)
  createdAt: Timestamp;
  isAuthUser: boolean;     // true = has auth, false = vote-only profile
}
```

**Indexes**: 
- `score` DESC (for rankings)

**Security Rules**:
```javascript
match /profiles/{profileId} {
  allow read: if true;
  allow create: if request.auth != null && request.auth.uid == profileId;
  allow update: if request.auth != null && request.auth.uid == profileId;
}
```

#### `votes`
```typescript
{
  id: string;              // Auto-generated
  winnerId: string;        // Profile ID
  loserId: string;         // Profile ID  
  voterId: string;         // User UID (for spam prevention)
  timestamp: Timestamp;
  processed: boolean;      // false until Cloud Function processes
}
```

**Indexes**:
- `processed` ASC, `timestamp` ASC (for Cloud Function query)

**Security Rules**:
```javascript
match /votes/{voteId} {
  allow create: if request.auth != null;
  allow read, update: if false; // Only Cloud Functions
}
```

### Firebase Storage

#### Structure
```
/profile_images/{userId}/{filename}
```

**Security Rules**:
```javascript
match /profile_images/{userId}/{fileName} {
  allow write: if request.auth != null 
               && request.auth.uid == userId
               && request.resource.size < 10 * 1024 * 1024  // 10MB
               && request.resource.contentType.matches('image/(jpeg|png|heic)');
  allow read: if true;
}
```

---

## Technical Decisions

### Why Write-Append Pattern?
**Problem**: 500 concurrent users voting causes 1000+ simultaneous profile updates → race conditions
**Solution**: Write votes as separate documents, batch process later → zero conflicts

### Why Pre-Fetching?
**Problem**: Fetching random profiles + calculating scores on-demand = 200-500ms lag
**Solution**: Pre-calculate 10 pairs in background → instant transitions

### Why Modified Elo?
**Problem**: Standard Elo treats all profiles equally → new profiles never rise
**Solution**: Variable K-factor based on vote count → new profiles swing wildly, established profiles stable

### Why Context API vs Redux?
**Decision**: Context API for auth and voting queue
**Reason**: Simple state, no complex actions, built-in to React

### Why Infinite Scroll vs Pagination?
**Decision**: Infinite scroll for rankings
**Reason**: Better mobile UX, users naturally scroll down leaderboards

---

## Performance Considerations

### Firestore Costs
- **Reads**: Each vote loads 2 profiles (pre-fetch) = 20 reads per vote session
- **Writes**: 1 write per vote (to `votes` collection)
- **Cloud Function**: Processes all votes in batch = 2 reads + 2 writes per vote

**Optimization**: Batch processing reduces write costs by ~95%

### Storage Costs
- **Image Compression**: <1MB per photo = 1000 users = <1GB storage
- **Bandwidth**: Images cached by CDN after first load

### Hosting Costs
- **Static Files**: React build = ~500KB gzipped
- **CDN**: Firebase Hosting CDN included in free tier

---

## Testing Strategy

### Unit Tests
- Scoring algorithm calculations
- Vote count aggregation logic
- Image compression function

### Integration Tests
- Auth flow (Google sign-in → profile creation)
- Vote flow (click → write → pre-fetch)
- Rankings load (top 100 → scroll → load more)

### Manual Testing Checklist
- [ ] Sign in with Google creates profile
- [ ] Profile uses Google name/photo
- [ ] Cannot vote on own profile
- [ ] Skip button works
- [ ] Vote updates scores immediately
- [ ] Pre-fetching prevents lag
- [ ] Settings modal uploads photo
- [ ] Photo compresses to <1MB
- [ ] Rankings show top 100
- [ ] Infinite scroll loads more
- [ ] Cloud Function processes votes
- [ ] Score floor at 100 works
- [ ] New profiles change ±100
- [ ] Established profiles change ±1

---

## Usage

- **Voting Page**: Users can vote on two displayed profiles. The scores will update instantly based on user interactions.
- **Rankings Page**: Users can view the rankings of all profiles, sorted by their scores.
- **Profile Management**: Users can sign up, set their names, and upload profile photos through the settings modal.

## Scoring System

### How Scores Change

- **Starting Score**: 1000 points for all profiles
- **Minimum Score**: 100 points (cannot go below)
- **Volatility**: Based on vote count history
  - **New profiles** (< 100 votes): ±100 points per vote
  - **Established profiles** (≥ 100 votes): ±1 point per vote
- **Modified Elo Formula**: Factors in score difference AND vote count
- **Batch Processing**: Cloud Function runs every 5-30 minutes to aggregate votes

### The Formula

Each vote calculates a score change using:
1. **Expected outcome** (standard Elo): Higher-rated profiles expected to win
2. **K-factor** (volatility): Based on each profile's vote count
3. **Actual outcome**: Winner gets positive change, loser gets negative
4. **Floor enforcement**: Scores cannot drop below 100

This creates natural drama: newcomers can rocket up quickly while established profiles have earned stability.

---

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any changes or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- React and VITE for the frontend framework.
- Firebase for backend services.
- The community for inspiration and support.