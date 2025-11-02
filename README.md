# Cloutscore - Social Scoring System Web Application

## Overview

Cloutscore is a web application that allows users to vote on profiles, influencing their social scores in a dynamic and engaging way. The application is built using React and VITE, with Firebase providing hosting and database management. Users can sign up using Google authentication, create profiles, and participate in voting to affect the rankings of various profiles.

## Features

- **User Authentication**: Sign up and log in using Google authentication.
- **Voting System**: Display two random profiles for users to vote on, with scores updated in real-time.
- **Profile Management**: Users can create and manage their profiles, including uploading profile photos.
- **Ranking Display**: View a list of all profiles ranked by their scores.
- **Dynamic Score Calculation**: Scores are calculated using a modified Elo formula, allowing for dramatic shifts in rankings based on user votes.

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

- Node.js (version 14 or higher)
- Firebase account

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd cloutscore
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Firebase:
   - Create a new Firebase project in the Firebase console.
   - Enable Firestore and Firebase Authentication (Google provider).
   - Create a Firebase Storage bucket.

4. Configure environment variables:
   - Copy `.env.example` to `.env` and fill in your Firebase configuration details.

### Running the Application

1. Start the development server:
   ```
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`.

### Deploying to Firebase

1. Install Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Log in to Firebase:
   ```
   firebase login
   ```

3. Deploy the application:
   ```
   firebase deploy
   ```

## Usage

- **Voting Page**: Users can vote on two displayed profiles. The scores will update instantly based on user interactions.
- **Rankings Page**: Users can view the rankings of all profiles, sorted by their scores.
- **Profile Management**: Users can sign up, set their names, and upload profile photos through the settings modal.

## Scoring System

- Each profile starts with a score of 1000.
- New profiles are more volatile, with score changes ranging from 50-150 points per vote.
- Established profiles with more votes have smaller score changes (5-30 points).
- A Cloud Function processes votes in batches to update scores efficiently.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any changes or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- React and VITE for the frontend framework.
- Firebase for backend services.
- The community for inspiration and support.