# Firebase Setup Guide for BTechVerse

## Current Issue
Login नहीं हो रहा क्योंकि Firebase project में Authentication properly setup नहीं है।

## Firebase Console Setup Steps

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" या existing project use करें

### Step 2: Add Web App
1. Project overview में जाएं
2. Click on "</>" (Web app icon)
3. App nickname दें: "BTechVerse"
4. Firebase Hosting enable करने की जरूरत नहीं
5. Click "Register app"

### Step 3: Enable Authentication
1. Left sidebar में "Authentication" पर click करें
2. "Get started" button click करें
3. "Sign-in method" tab में जाएं
4. "Email/Password" को enable करें
5. "Email link (passwordless sign-in)" को भी enable कर सकते हैं (optional)

### Step 4: Setup Firestore Database
1. Left sidebar में "Firestore Database" पर click करें
2. "Create database" button click करें
3. "Start in test mode" select करें (later में rules change कर सकते हैं)
4. Location select करें (asia-south1 for India)

### Step 5: Setup Storage
1. Left sidebar में "Storage" पर click करें
2. "Get started" button click करें
3. "Start in test mode" select करें

### Step 6: Get Configuration Keys
1. Project settings में जाएं (gear icon)
2. "General" tab में scroll down करें
3. "Your apps" section में web app मिलेगा
4. Configuration object में ये values हैं:
   - `apiKey` → VITE_FIREBASE_API_KEY
   - `projectId` → VITE_FIREBASE_PROJECT_ID  
   - `appId` → VITE_FIREBASE_APP_ID

### Step 7: Add Authorized Domain
1. Authentication → Settings → Authorized domains
2. Add your Replit domain (जो currently चल रहा है)

## Current Configuration Status
The app is looking for these environment variables:
- VITE_FIREBASE_API_KEY ✓ (set)
- VITE_FIREBASE_PROJECT_ID ✓ (set)  
- VITE_FIREBASE_APP_ID ✓ (set)

लेकिन Firebase console में Authentication enabled नहीं है, इसलिए login fail हो रहा है।