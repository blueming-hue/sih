# Digital Psychological Intervention System - Integration & Deployment Guide

This comprehensive guide covers the complete setup, integration, and deployment of the Digital Psychological Intervention System.

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Firebase Setup](#firebase-setup)
5. [Frontend Setup (React)](#frontend-setup-react)
6. [Backend Setup (Python)](#backend-setup-python)
7. [Integration](#integration)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

## Project Overview

The Digital Psychological Intervention System is a comprehensive mental health support platform designed for college students. It includes:

- **AI-powered chatbot** for immediate support
- **Confidential booking system** for professional counseling
- **Peer support forum** for community connection
- **Resource hub** with educational materials
- **Personal journaling** for self-reflection
- **Assessment tools** (PHQ-9, GAD-7)
- **Admin dashboard** for analytics and management

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Python Backend │    │   Firebase      │
│                 │    │                 │    │                 │
│ • Authentication│◄──►│ • AI Chatbot    │◄──►│ • Authentication│
│ • UI Components │    │ • Sentiment     │    │ • Firestore DB  │
│ • State Mgmt    │    │ • Assessments   │    │ • Cloud Storage │
│ • API Calls     │    │ • Crisis Detect │    │ • Hosting       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### Development Environment
- Node.js 16+ and npm
- Python 3.8+
- Git
- Code editor (VS Code recommended)

### Accounts & Services
- Firebase account
- Google Cloud Platform account
- Domain name (for production)
- SSL certificate (for production)

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "digital-psychological-intervention"
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**
5. Configure authorized domains

### 3. Set up Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select location (choose closest to your users)
5. Create database

### 4. Configure Firestore Security Rules

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat conversations - users can only access their own
    match /chat_conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        (resource.data.user_id == request.auth.uid || 
         request.auth.token.role in ['counsellor', 'admin']);
    }
    
    // Appointments - users can access their own, counsellors can access assigned
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null && 
        (resource.data.studentId == request.auth.uid || 
         resource.data.counsellorId == request.auth.uid ||
         request.auth.token.role == 'admin');
    }
    
    // Forum posts - authenticated users can read/write
    match /forum_posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Journal entries - users can only access their own
    match /journal_entries/{entryId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Assessments - users can only access their own
    match /assessments/{assessmentId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Resources - all authenticated users can read
    match /resources/{resourceId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
  }
}
```

### 5. Set up Cloud Storage

1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Select location
5. Create bucket

### 6. Generate Service Account Key

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Keep this file secure - it provides admin access

### 7. Get Firebase Configuration

1. Go to **Project Settings** → **General**
2. Scroll down to **Your apps**
3. Click **Web app** icon
4. Register app with name "DPIS Web App"
5. Copy the configuration object

## Frontend Setup (React)

### 1. Install Dependencies

```bash
# Navigate to project root
cd SIH

# Install npm dependencies
npm install

# Install additional dependencies if needed
npm install axios recharts react-hook-form react-hot-toast lucide-react date-fns
```

### 2. Configure Firebase

1. Create `src/firebase/config.js` with your Firebase config:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

### 3. Environment Variables

Create `.env.local` file:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_PYTHON_BACKEND_URL=http://localhost:5000
```

### 4. Start Development Server

```bash
npm start
```

The app will be available at `http://localhost:3000`

## Backend Setup (Python)

### 1. Set up Python Environment

```bash
# Navigate to backend directory
cd python_backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Download NLTK Data

```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('vader_lexicon'); nltk.download('stopwords')"
```

### 3. Configure Environment

Create `.env` file:

```env
FLASK_ENV=development
PORT=5000
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000
```

### 4. Set up Firebase Service Account

Place your Firebase service account JSON file as `firebase-service-account.json` in the backend directory.

### 5. Start Backend Server

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## Integration

### 1. Frontend-Backend Communication

The React frontend communicates with the Python backend through REST API calls:

```javascript
// Example API call from React
const response = await fetch(`${process.env.REACT_APP_PYTHON_BACKEND_URL}/api/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: userMessage,
    user_id: user.uid,
    session_id: sessionId
  })
});

const data = await response.json();
```

### 2. Firebase Integration

Both frontend and backend use Firebase:

- **Frontend**: Authentication, Firestore reads/writes, real-time updates
- **Backend**: Firestore for conversation storage, assessment results, analytics

### 3. Real-time Updates

Use Firebase real-time listeners for live updates:

```javascript
import { onSnapshot, collection, query, where } from 'firebase/firestore';

// Listen to chat messages
const unsubscribe = onSnapshot(
  query(collection(db, 'chat_messages'), where('sessionId', '==', sessionId)),
  (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    setMessages(messages);
  }
);
```

## Deployment

### Frontend Deployment (Firebase Hosting)

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting:**
   ```bash
   firebase init hosting
   ```

4. **Build React App:**
   ```bash
   npm run build
   ```

5. **Deploy:**
   ```bash
   firebase deploy
   ```

### Alternative Frontend Deployment (Vercel)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

### Backend Deployment (Heroku)

1. **Install Heroku CLI**

2. **Create Heroku App:**
   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables:**
   ```bash
   heroku config:set FLASK_ENV=production
   heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY="your-key-here"
   heroku config:set CORS_ORIGINS="https://your-frontend-domain.com"
   ```

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Alternative Backend Deployment (Google Cloud Run)

1. **Create Dockerfile:**
   ```dockerfile
   FROM python:3.9-slim

   WORKDIR /app

   COPY requirements.txt .
   RUN pip install -r requirements.txt

   COPY . .

   CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8080", "app:app"]
   ```

2. **Build and Deploy:**
   ```bash
   gcloud builds submit --tag gcr.io/your-project/dpis-backend
   gcloud run deploy --image gcr.io/your-project/dpis-backend --platform managed
   ```

## Testing

### Frontend Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

### Backend Testing

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run tests
pytest

# Run with coverage
pytest --cov=.
```

### Integration Testing

1. **Test Authentication Flow:**
   - Register new user
   - Login/logout
   - Password reset

2. **Test Chatbot:**
   - Send messages
   - Verify AI responses
   - Test crisis detection

3. **Test Booking System:**
   - Create appointments
   - Verify notifications
   - Test cancellation

4. **Test Assessments:**
   - Complete PHQ-9 and GAD-7
   - Verify scoring
   - Check recommendations

## Monitoring & Maintenance

### 1. Firebase Monitoring

- Monitor Firestore usage and costs
- Set up alerts for high usage
- Review security rules regularly

### 2. Backend Monitoring

- Set up logging and error tracking
- Monitor API response times
- Track crisis detection accuracy

### 3. User Analytics

- Track user engagement
- Monitor feature usage
- Analyze sentiment trends

### 4. Security Maintenance

- Regular security audits
- Update dependencies
- Review access logs
- Monitor for suspicious activity

## Troubleshooting

### Common Issues

1. **Firebase Authentication Errors:**
   - Check API keys
   - Verify authorized domains
   - Check security rules

2. **CORS Issues:**
   - Update CORS_ORIGINS in backend
   - Check frontend URL configuration

3. **Python Backend Not Starting:**
   - Check Python version (3.8+)
   - Verify all dependencies installed
   - Check environment variables

4. **NLTK Download Errors:**
   ```bash
   python -c "import nltk; nltk.download('punkt')"
   ```

5. **Firebase Permission Denied:**
   - Check Firestore security rules
   - Verify user authentication
   - Check user roles

### Performance Optimization

1. **Frontend:**
   - Use React.memo for components
   - Implement code splitting
   - Optimize bundle size

2. **Backend:**
   - Implement caching
   - Optimize database queries
   - Use connection pooling

3. **Firebase:**
   - Optimize Firestore queries
   - Use indexes for complex queries
   - Implement pagination

### Support Resources

- Firebase Documentation: https://firebase.google.com/docs
- React Documentation: https://reactjs.org/docs
- Flask Documentation: https://flask.palletsprojects.com/
- Mental Health Resources: https://www.nimh.nih.gov/

## Security Considerations

1. **Data Privacy:**
   - Encrypt sensitive data
   - Implement data retention policies
   - Regular security audits

2. **Crisis Management:**
   - Immediate escalation procedures
   - Crisis resource availability
   - Staff training protocols

3. **Compliance:**
   - HIPAA considerations (if applicable)
   - FERPA compliance for educational data
   - Local mental health regulations

## Conclusion

This guide provides a comprehensive roadmap for setting up and deploying the Digital Psychological Intervention System. The system is designed to be scalable, secure, and user-friendly while providing essential mental health support to college students.

For additional support or questions, please refer to the individual component documentation or contact the development team.
