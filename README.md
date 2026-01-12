# BTechVerse - Academic Resource Hub

A comprehensive platform for BTech students to access study materials, previous year papers, and AI-powered assistance.

## Features

- 📚 Study Notes and Materials
- 📄 Previous Year Question Papers
- 🤖 AI-Powered Chatbot Assistant
- 🔍 Advanced Search and Filtering
- 📊 Multiple Branch Support (CSE, AIML, Data Science, Cyber Security, ECE)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd BTechVerse
```

### 2. Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file and add your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
VITE_FIREBASE_APP_ID=your_firebase_app_id_here
```

**Important:** Never commit the `.env` file to git! It's already in `.gitignore`.

### 3. Install Python Dependencies (Optional)

For better environment variable handling:
```bash
pip3 install python-dotenv
```

If you don't install it, the server will still work by manually reading the `.env` file.

### 4. Run the Server

```bash
python3 server.py
```

The server will start on `http://localhost:8000`

## Project Structure

```
BTechVerse/
├── index.html          # Homepage
├── login.html          # Login page
├── signup.html         # Signup page
├── resources.html      # All resources page
├── branch.html         # Branch-specific resources
├── dashboard.html      # Admin dashboard
├── upload.html         # File upload page
├── server.py           # Python HTTP server with API proxy
├── .env                # Environment variables (not in git)
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore file
├── js/
│   ├── auth.js         # Authentication logic
│   ├── chatbot.js      # AI chatbot functionality
│   ├── display.js      # Resource display logic
│   ├── firebase.js     # Firebase configuration
│   ├── s3-service.js   # AWS S3 integration
│   ├── stats.js        # Statistics tracking
│   └── utils.js        # Utility functions
└── assets/
    └── style.css       # Styling
```

## Security Notes

- All API keys are stored in `.env` file which is excluded from git
- Never commit sensitive information to the repository
- The `.env` file is automatically ignored by git (see `.gitignore`)

## Development

- Server runs on port 8000 by default
- Chatbot API endpoint: `/api/chat` (POST)
- All static files are served from the root directory

## License

© 2025 BTechVerse. All rights reserved.
