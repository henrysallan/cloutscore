# Firebase Setup Complete! ✅

## Current Status

Your Firebase project is **configured and ready** for development!

### ✅ Completed Setup

1. **Firebase Project**: `cloutscore-fb225`
   - Console: https://console.firebase.google.com/project/cloutscore-fb225/overview

2. **Firestore Database**: Enabled
   - Security rules deployed
   - Composite indexes configured for efficient querying
   - Collections ready: `profiles`, `votes`

3. **Cloud Storage**: Enabled
   - Security rules deployed
   - Profile images path: `/profile_images/{userId}/{fileName}`
   - Max upload size: 5MB per image

4. **Configuration Files**:
   - `.firebaserc` - Project linked
   - `firebase.json` - Services configured
   - `.env` - Environment variables set
   - `firestore.rules` - Database security
   - `storage.rules` - Storage security
   - `firestore.indexes.json` - Query indexes

---

## ⚠️ Next Steps Required

### 1. Enable Google Authentication (REQUIRED)

**You must enable this manually in the Firebase Console:**

1. Go to: https://console.firebase.google.com/project/cloutscore-fb225/authentication/providers
2. Click on "Google" under Sign-in providers
3. Toggle "Enable"
4. Select your support email: `isthishenry@gmail.com`
5. Click "Save"

**Why needed?**: Users need to sign in with Google to create profiles and vote

---

### 2. Deploy Cloud Functions

Your Cloud Functions are ready to deploy but need to be built first:

```powershell
# Install dependencies
cd functions
npm install

# Build TypeScript to JavaScript
npm run build

# Deploy to Firebase
cd ..
firebase deploy --only functions
```

**What this does**: Deploys the batch vote processing function that runs every 5 minutes

---

### 3. Install App Dependencies

```powershell
# Install main app dependencies
npm install

# Start development server
npm run dev
```

---

## 🗄️ Firestore Database Structure

### Collections

#### `profiles`
```javascript
{
  id: string,              // User's Firebase Auth UID
  firstName: string,
  lastName: string,
  score: number,           // Starts at 1000
  imageUrl: string,        // Firebase Storage URL
  voteCount: number,       // Total votes received
  createdAt: timestamp
}
```

**Security**: 
- Anyone can read
- Only owner can create/update their own profile

#### `votes`
```javascript
{
  id: string,              // Auto-generated
  winnerId: string,        // Profile ID of winner
  loserId: string,         // Profile ID of loser
  voterId: string,         // User who voted (optional)
  timestamp: timestamp,
  processed: boolean       // False until Cloud Function processes it
}
```

**Security**:
- Authenticated users can create votes
- Only Cloud Functions can read/update

---

## 📦 Storage Structure

```
cloutscore-fb225.firebasestorage.app/
└── profile_images/
    └── {userId}/
        └── {filename.jpg}
```

**Security**:
- Users can only upload to their own folder (`/profile_images/{their-uid}/`)
- Max file size: 5MB
- Only image files allowed (jpg, png, gif, etc.)
- Anyone can read images (public profiles)

---

## 🔒 Security Rules Summary

### Firestore Rules
- **Profiles**: Public read, authenticated write (own profile only)
- **Votes**: Authenticated create only, no public read/update

### Storage Rules
- **Profile Images**: Public read, authenticated write (own folder only)
- **Size Limit**: 5MB per file
- **Type Check**: Must be image/* MIME type

---

## 🚀 Deployment Commands

### Deploy Everything
```powershell
firebase deploy
```

### Deploy Specific Services
```powershell
# Hosting only (frontend)
firebase deploy --only hosting

# Functions only (backend)
firebase deploy --only functions

# Security rules only
firebase deploy --only firestore:rules,storage:rules
```

### Build & Deploy Frontend
```powershell
npm run build
firebase deploy --only hosting
```

Your app will be live at: `https://cloutscore-fb225.web.app`

---

## 🧪 Local Development & Testing

### Firebase Emulators (Optional)

Run Firebase services locally for testing:

```powershell
# Initialize emulators (first time only)
firebase init emulators

# Start emulators
firebase emulators:start
```

This runs local versions of:
- Firestore
- Authentication
- Functions
- Storage

Update your `.env` for local testing:
```bash
VITE_USE_EMULATOR=true
```

---

## 📊 Monitoring & Logs

### View Cloud Function Logs
```powershell
firebase functions:log
```

### View Firestore Usage
https://console.firebase.google.com/project/cloutscore-fb225/firestore/usage

### View Storage Usage
https://console.firebase.google.com/project/cloutscore-fb225/storage

### View Authentication Users
https://console.firebase.google.com/project/cloutscore-fb225/authentication/users

---

## 🔑 Environment Variables

Your `.env` file contains:
```bash
VITE_FIREBASE_API_KEY=AIzaSyAGqrkspIPK0PCpp0lNpKOi6TreASzrAWg
VITE_FIREBASE_AUTH_DOMAIN=cloutscore-fb225.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cloutscore-fb225
VITE_FIREBASE_STORAGE_BUCKET=cloutscore-fb225.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=791486190583
VITE_FIREBASE_APP_ID=1:791486190583:web:d3e28380f23caf5683d4f2
VITE_FIREBASE_MEASUREMENT_ID=G-NSGZNJHLWB
```

**⚠️ Security Note**: 
- `.env` is in `.gitignore` - it won't be committed
- API key is safe to expose (it's protected by Firebase security rules)
- Share `.env.example` with other developers, not `.env`

---

## 💰 Cost Considerations

Firebase Free Tier (Spark Plan):
- **Firestore**: 50K reads, 20K writes, 20K deletes per day
- **Storage**: 5GB storage, 1GB download per day
- **Functions**: 125K invocations, 40K GB-seconds per month
- **Hosting**: 10GB storage, 360MB/day bandwidth

For this app:
- Each vote = 1 write to `votes` collection
- Cloud Function runs every 5 minutes = ~8,640 invocations/month
- Each vote processes = 2 profile reads + 2 profile writes

**Recommendation**: Start with free tier, upgrade to Blaze (pay-as-you-go) if you exceed limits

---

## 🆘 Troubleshooting

### "Firebase init failed"
✅ **FIXED** - `.firebaserc` now has correct project ID

### "Insufficient permissions"
- Make sure you're logged in: `firebase login`
- Check you have owner/editor role in Firebase Console

### "Function deployment failed"
- Run `cd functions && npm install && npm run build`
- Check `functions/src/index.ts` for TypeScript errors

### "Cannot read profiles"
- Enable Firestore in Firebase Console
- Deploy security rules: `firebase deploy --only firestore:rules`

### "Authentication not working"
- Enable Google provider in Authentication settings
- Check `.env` has correct `VITE_FIREBASE_AUTH_DOMAIN`

---

## 📝 Quick Reference

| What | Command |
|------|---------|
| Login to Firebase | `firebase login` |
| Check current project | `firebase use` |
| Switch project | `firebase use cloutscore-fb225` |
| Deploy everything | `firebase deploy` |
| View logs | `firebase functions:log` |
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Preview production build | `npm run preview` |

---

## ✅ Setup Checklist

- [x] Firebase project created (`cloutscore-fb225`)
- [x] Firestore database enabled
- [x] Firestore security rules deployed
- [x] Firestore indexes deployed
- [x] Cloud Storage enabled
- [x] Storage security rules deployed
- [x] `.firebaserc` configured
- [x] `firebase.json` configured
- [x] `.env` file created with config
- [x] `.gitignore` updated
- [ ] **Google Authentication enabled** ← DO THIS NEXT
- [ ] Cloud Functions deployed
- [ ] App dependencies installed
- [ ] First test profile created

---

**Your Firebase project is ready! 🎉**

Next: Enable Google Authentication and deploy your functions!
