# Digital Psychological Intervention System - Project Structure

This document provides a comprehensive overview of the complete project structure for the Digital Psychological Intervention System.

## 📁 Complete Project Structure

```
SIH/
├── 📄 package.json                          # React app dependencies and scripts
├── 📄 tailwind.config.js                    # TailwindCSS configuration
├── 📄 postcss.config.js                     # PostCSS configuration
├── 📄 README.md                             # Main project documentation
├── 📄 INTEGRATION_GUIDE.md                  # Comprehensive setup and deployment guide
├── 📄 PROJECT_STRUCTURE.md                  # This file
│
├── 📁 public/                               # Static assets
│   ├── 📄 index.html                        # Main HTML template
│   └── 📄 manifest.json                     # PWA manifest
│
├── 📁 src/                                  # React frontend source code
│   ├── 📄 index.js                          # React app entry point
│   ├── 📄 index.css                         # Global styles with TailwindCSS
│   ├── 📄 App.js                            # Main React component with routing
│   │
│   ├── 📁 components/                       # Reusable UI components
│   │   ├── 📁 layout/                       # Layout components
│   │   │   ├── 📄 Navbar.js                 # Navigation bar with user menu
│   │   │   └── 📄 Footer.js                 # Footer with links and contact info
│   │   └── 📁 common/                       # Common components
│   │       └── 📄 LoadingSpinner.js         # Loading spinner component
│   │
│   ├── 📁 contexts/                         # React contexts for state management
│   │   ├── 📄 AuthContext.js                # Authentication context
│   │   └── 📄 UserContext.js                # User data context
│   │
│   ├── 📁 firebase/                         # Firebase configuration and utilities
│   │   ├── 📄 config.js                     # Firebase app configuration
│   │   ├── 📄 auth.js                       # Authentication functions
│   │   └── 📄 firestore.js                  # Firestore database functions
│   │
│   └── 📁 pages/                            # Page components
│       ├── 📄 Home.js                       # Landing page
│       ├── 📄 Dashboard.js                  # User dashboard with analytics
│       ├── 📄 Chatbot.js                    # AI chatbot interface
│       ├── 📄 Booking.js                    # Appointment booking system
│       ├── 📄 Forum.js                      # Peer support forum
│       ├── 📄 Resources.js                  # Resource hub
│       ├── 📄 Journal.js                    # Personal journaling
│       │
│       ├── 📁 auth/                         # Authentication pages
│       │   ├── 📄 Login.js                  # User login page
│       │   └── 📄 Register.js               # User registration page
│       │
│       ├── 📁 admin/                        # Admin dashboard
│       │   └── 📄 AdminDashboard.js         # Admin analytics and management
│       │
│       └── 📁 counsellor/                   # Counsellor dashboard
│           └── 📄 CounsellorDashboard.js    # Counsellor appointment management
│
├── 📁 python_backend/                       # Python Flask backend
│   ├── 📄 app.py                            # Main Flask application
│   ├── 📄 requirements.txt                  # Python dependencies
│   ├── 📄 env_example.txt                   # Environment variables template
│   ├── 📄 README.md                         # Backend documentation
│   │
│   ├── 📁 chatbot/                          # AI chatbot logic
│   │   └── 📄 mental_health_chatbot.py      # Chatbot with crisis detection
│   │
│   ├── 📁 sentiment/                        # Sentiment analysis
│   │   └── 📄 sentiment_analyzer.py         # Advanced sentiment analysis
│   │
│   └── 📁 assessment/                       # Assessment tools
│       └── 📄 phq9_gad7.py                  # PHQ-9 and GAD-7 assessments
│
└── 📁 mock_data/                            # Mock data for testing
    ├── 📄 sample_data.js                    # JavaScript mock data
    ├── 📄 seed_database.py                  # Python database seeding script
    └── 📄 README.md                         # Mock data documentation
```

## 🏗️ Architecture Overview

### Frontend (React.js)
- **Framework**: React 18 with functional components and hooks
- **Styling**: TailwindCSS for utility-first styling
- **Routing**: React Router for client-side navigation
- **State Management**: React Context API for global state
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form for form management
- **Notifications**: React Hot Toast for user feedback

### Backend (Python Flask)
- **Framework**: Flask with RESTful API design
- **AI/NLP**: NLTK, TextBlob, and scikit-learn for natural language processing
- **Database**: Firebase Firestore for data storage
- **Authentication**: Firebase Admin SDK for server-side auth
- **CORS**: Flask-CORS for cross-origin requests

### Database (Firebase)
- **Authentication**: Firebase Auth for user management
- **Database**: Firestore for real-time data storage
- **Storage**: Firebase Storage for file uploads
- **Hosting**: Firebase Hosting for frontend deployment

## 🔧 Key Features Implementation

### 1. AI-Guided First-Aid Chatbot
- **Location**: `python_backend/chatbot/mental_health_chatbot.py`
- **Features**: Crisis detection, sentiment analysis, personalized responses
- **Integration**: REST API endpoint `/api/chat`

### 2. Confidential Booking System
- **Location**: `src/pages/Booking.js`
- **Features**: Secure appointment scheduling, anonymous booking
- **Database**: Firestore collections `appointments`, `users`

### 3. Peer Support Forum
- **Location**: `src/pages/Forum.js`
- **Features**: Anonymous posting, real-time updates, moderation
- **Database**: Firestore collections `forum_posts`, `forum_comments`

### 4. Resource Hub
- **Location**: `src/pages/Resources.js`
- **Features**: Categorized resources, multiple languages, dynamic content
- **Database**: Firestore collection `resources`

### 5. Personal Journaling
- **Location**: `src/pages/Journal.js`
- **Features**: Private entries, mood tracking, progress monitoring
- **Database**: Firestore collection `journal_entries`

### 6. Assessment Tools
- **Location**: `python_backend/assessment/phq9_gad7.py`
- **Features**: PHQ-9 depression screening, GAD-7 anxiety assessment
- **Integration**: REST API endpoints `/api/assessment/phq9`, `/api/assessment/gad7`

### 7. Admin Dashboard
- **Location**: `src/pages/admin/AdminDashboard.js`
- **Features**: Analytics, user management, crisis monitoring
- **Database**: Aggregated data from multiple collections

## 🔐 Security & Privacy

### Authentication & Authorization
- **Firebase Auth**: Secure user authentication
- **Role-based Access**: Student, Counsellor, Admin roles
- **JWT Tokens**: Secure session management

### Data Privacy
- **Anonymous Interactions**: Users remain anonymous in peer spaces
- **Encrypted Storage**: All data encrypted in transit and at rest
- **Privacy Rules**: Firestore security rules for data access control

### Crisis Management
- **Crisis Detection**: AI-powered crisis identification
- **Immediate Escalation**: Automatic crisis resource provision
- **Professional Support**: Seamless connection to mental health professionals

## 📊 Data Flow

### User Registration Flow
1. User fills registration form → `src/pages/auth/Register.js`
2. Firebase Auth creates user → `src/firebase/auth.js`
3. User document created in Firestore → `src/firebase/firestore.js`
4. Email verification sent → Firebase Auth

### Chatbot Interaction Flow
1. User sends message → `src/pages/Chatbot.js`
2. Message sent to Python backend → `python_backend/app.py`
3. Sentiment analysis performed → `python_backend/sentiment/sentiment_analyzer.py`
4. AI response generated → `python_backend/chatbot/mental_health_chatbot.py`
5. Response saved to Firestore → `python_backend/app.py`
6. Real-time update to frontend → Firebase listeners

### Appointment Booking Flow
1. User selects counsellor and time → `src/pages/Booking.js`
2. Appointment data validated → Frontend validation
3. Appointment created in Firestore → `src/firebase/firestore.js`
4. Notification sent to counsellor → Firebase Cloud Functions (optional)
5. Confirmation email sent → Email service integration

## 🚀 Deployment Architecture

### Frontend Deployment
- **Primary**: Firebase Hosting
- **Alternative**: Vercel, Netlify
- **Build Process**: `npm run build` → Static files → CDN distribution

### Backend Deployment
- **Primary**: Heroku
- **Alternative**: Google Cloud Run, AWS Lambda
- **Process**: Docker container → Cloud platform → Auto-scaling

### Database
- **Firebase Firestore**: Managed NoSQL database
- **Global Distribution**: Multi-region replication
- **Auto-scaling**: Handles traffic spikes automatically

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: Cypress for user journey testing

### Backend Testing
- **Unit Tests**: pytest for individual functions
- **API Tests**: Flask test client for endpoint testing
- **Integration Tests**: Firebase emulator for database testing

### Mock Data
- **Development**: `mock_data/sample_data.js` for frontend testing
- **Database Seeding**: `mock_data/seed_database.py` for Firestore population
- **Realistic Scenarios**: Comprehensive test data covering all features

## 📈 Monitoring & Analytics

### User Analytics
- **Engagement Metrics**: User activity tracking
- **Feature Usage**: Component interaction analytics
- **Performance Metrics**: Page load times, API response times

### Mental Health Analytics
- **Sentiment Trends**: Emotional state tracking over time
- **Crisis Detection**: Crisis intervention monitoring
- **Assessment Results**: Mental health screening analytics

### System Monitoring
- **Error Tracking**: Application error monitoring
- **Performance Monitoring**: System resource usage
- **Security Monitoring**: Unusual activity detection

## 🔄 Maintenance & Updates

### Regular Maintenance
- **Dependency Updates**: Security patches and feature updates
- **Database Optimization**: Query performance tuning
- **Security Audits**: Regular security assessments

### Feature Updates
- **New Assessments**: Additional mental health screening tools
- **Enhanced AI**: Improved chatbot responses and crisis detection
- **Mobile App**: React Native mobile application
- **Integration**: University system integrations

## 📚 Documentation

### Developer Documentation
- **Setup Guide**: `INTEGRATION_GUIDE.md`
- **API Documentation**: Backend endpoint documentation
- **Component Documentation**: React component usage guides

### User Documentation
- **User Manual**: Feature usage instructions
- **Crisis Resources**: Emergency contact information
- **Privacy Policy**: Data handling and privacy information

## 🎯 Future Enhancements

### Planned Features
- **Mobile Application**: React Native mobile app
- **Advanced AI**: GPT integration for enhanced responses
- **Group Therapy**: Virtual group session capabilities
- **Integration**: University LMS and student information systems
- **Multilingual Support**: Additional language support
- **Advanced Analytics**: Machine learning insights

### Scalability Considerations
- **Microservices**: Backend service decomposition
- **CDN**: Global content delivery network
- **Load Balancing**: Traffic distribution optimization
- **Database Sharding**: Horizontal database scaling

This project structure provides a solid foundation for a comprehensive mental health support system that can scale and evolve with the needs of college students and mental health professionals.
