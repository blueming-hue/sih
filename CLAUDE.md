# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MINDLY** - Mental Health INsights & Digital support for Learning Youth. A comprehensive mental health support platform for college students featuring AI-guided chatbot, confidential counsellor bookings, peer support forum, and assessment tools.

## Tech Stack

**Frontend**: React 18.2.0 + TailwindCSS + Firebase SDK + React Router DOM
**Backend**: Python Flask + NLTK/TextBlob + Scikit-learn + Transformers + Firebase Admin SDK

## Development Commands

### Frontend
```bash
npm install                 # Install dependencies
npm start                  # Development server (localhost:3000)
npm run build              # Production build
npm test                   # Run tests
```

### Backend
```bash
cd python_backend
python -m venv venv        # Create virtual environment
# Activate: venv\Scripts\activate (Windows) or source venv/bin/activate (Unix)
pip install -r requirements.txt
python -c "import nltk; nltk.download('punkt'); nltk.download('vader_lexicon')"
python app.py              # Start Flask server (localhost:5000)
```

### Deployment
```bash
firebase deploy            # Deploy frontend to Firebase Hosting
```

## Architecture

### Role-Based System
- **Students**: Access chatbot, assessments, forum, booking
- **Counsellors**: Manage bookings, resources, view analytics
- **Admins**: Manage counsellors, view system analytics

### Key Directories
- `src/pages/auth/` - Login/Register
- `src/pages/admin/` - Admin dashboard and counsellor management
- `src/pages/counsellor/` - Counsellor dashboard, bookings, availability
- `src/contexts/` - AuthContext and UserContext for state management
- `python_backend/` - Flask API with chatbot, assessment, sentiment modules

### Authentication Flow
Uses Firebase Auth with role-based routing. Protected routes automatically redirect based on user role (`student`, `counsellor`, `admin`).

### Database (Firestore)
- `resources` - Global mental health resources
- `resources_counsellors` - Counsellor-owned resources with file uploads
- `forum_posts` with `comments` subcollection for anonymous peer support
- Role-based security rules (8720 lines in firestore.rules)

### Mental Health Features
- Crisis detection in AI chatbot responses
- PHQ-9 depression and GAD-7 anxiety assessments
- Sentiment analysis with mental health-specific keywords
- Anonymous forum participation for peer support
- End-to-end encryption for sensitive data

## Configuration

### Environment Variables
**Frontend (.env.local)**:
- Firebase config (apiKey, authDomain, projectId, etc.)

**Backend (.env)**:
- Firebase service account JSON path
- Flask configuration

### Important Files
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Database security rules
- `tailwind.config.js` - Custom styling with mental health color schemes
- `python_backend/app.py` - Main Flask application entry point

## Development Patterns

### Frontend
- Use AuthContext for authentication state
- Implement ProtectedRoute for role-based access
- Follow TailwindCSS utility-first approach
- Use React Hook Form for form validation
- Toast notifications with react-hot-toast

### Backend
- Modular Flask structure (separate files for chatbot, assessment, sentiment)
- Firebase Admin SDK for server-side operations
- Comprehensive error handling and logging
- CORS enabled for frontend integration

### Styling
- Custom TailwindCSS theme with primary blue and secondary gray
- Responsive design patterns
- Inter font family for consistency