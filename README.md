# Digital Psychological Intervention System (DPIS)

A comprehensive mental health support platform designed specifically for college students, providing AI-guided assistance, professional counseling, and peer support in a safe, confidential environment.

## 🌟 Features

### Core Modules

- **🤖 AI-Guided First-Aid Chatbot**
  - Immediate support and coping strategies
  - Crisis detection and escalation
  - 24/7 availability
  - Sentiment analysis and personalized responses

- **📅 Confidential Booking System**
  - Secure appointment scheduling with counselors
  - Anonymous booking process
  - Multiple session types (video, phone, in-person)
  - Automated reminders and confirmations

- **👥 Peer Support Forum**
  - Anonymous peer-to-peer communication
  - Topic-based communities
  - Moderated discussions
  - Real-time chat capabilities

- **📚 Psychoeducational Resource Hub**
  - Curated mental health resources
  - Videos, articles, and guides
  - Multiple languages support
  - Interactive learning materials

- **📝 Personal Journaling Module**
  - Private digital journal
  - Mood tracking and insights
  - Progress monitoring
  - Secure data storage

- **📊 Assessment Tools**
  - PHQ-9 Depression Screening
  - GAD-7 Anxiety Assessment
  - Automated scoring and recommendations
  - Progress tracking over time

- **👨‍💼 Admin Dashboard**
  - Anonymous analytics and insights
  - User engagement metrics
  - Crisis intervention monitoring
  - Resource management

## 🏗️ Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Firebase SDK** - Real-time database and authentication

### Backend
- **Python Flask** - RESTful API server
- **NLTK & TextBlob** - Natural language processing
- **Scikit-learn** - Machine learning for sentiment analysis
- **Firebase Admin SDK** - Server-side Firebase integration

### Database & Storage
- **Firebase Firestore** - NoSQL document database
- **Firebase Storage** - File and media storage
- **Firebase Authentication** - User management and security

### Deployment
- **Firebase Hosting** - Frontend hosting
- **Heroku/Google Cloud** - Backend hosting
- **Docker** - Containerization support

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- Firebase account
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/digital-psychological-intervention-system.git
   cd digital-psychological-intervention-system
   ```

2. **Set up Firebase:**
   - Create a Firebase project
   - Enable Authentication, Firestore, and Storage
   - Download service account key
   - See [Firebase Setup Guide](INTEGRATION_GUIDE.md#firebase-setup) for details

3. **Frontend Setup:**
   ```bash
   # Install dependencies
   npm install
   
   # Configure environment variables
   cp .env.example .env.local
   # Edit .env.local with your Firebase config
   
   # Start development server
   npm start
   ```

4. **Backend Setup:**
   ```bash
   # Navigate to backend directory
   cd python_backend
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Download NLTK data
   python -c "import nltk; nltk.download('punkt'); nltk.download('vader_lexicon')"
   
   # Configure environment
   cp env_example.txt .env
   # Edit .env with your configuration
   
   # Start backend server
   python app.py
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
digital-psychological-intervention-system/
├── src/                          # React frontend
│   ├── components/               # Reusable UI components
│   │   ├── layout/              # Layout components (Navbar, Footer)
│   │   ├── common/              # Common components
│   │   └── features/            # Feature-specific components
│   ├── pages/                   # Page components
│   │   ├── auth/                # Authentication pages
│   │   ├── admin/               # Admin dashboard
│   │   └── counsellor/          # Counsellor dashboard
│   ├── contexts/                # React contexts
│   ├── firebase/                # Firebase configuration
│   └── utils/                   # Utility functions
├── python_backend/              # Python backend
│   ├── app.py                   # Main Flask application
│   ├── chatbot/                 # AI chatbot logic
│   ├── sentiment/               # Sentiment analysis
│   ├── assessment/              # Assessment tools
│   └── requirements.txt         # Python dependencies
├── public/                      # Static assets
├── docs/                        # Documentation
├── INTEGRATION_GUIDE.md         # Comprehensive setup guide
└── README.md                    # This file
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local):**
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_PYTHON_BACKEND_URL=http://localhost:5000
```

**Backend (.env):**
```env
FLASK_ENV=development
PORT=5000
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000
```

## 🚀 Deployment

### Frontend (Firebase Hosting)

```bash
# Build the app
npm run build

# Deploy to Firebase
firebase deploy
```

### Backend (Heroku)

```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY="your-key"

# Deploy
git push heroku main
```

For detailed deployment instructions, see [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md#deployment).

## 🧪 Testing

### Frontend Testing
```bash
npm test
npm run test:coverage
```

### Backend Testing
```bash
cd python_backend
pytest
pytest --cov=.
```

### Integration Testing
- Test authentication flow
- Verify chatbot responses
- Test booking system
- Validate assessment tools

## 📊 Features in Detail

### AI Chatbot
- **Crisis Detection**: Automatically identifies crisis situations and provides immediate resources
- **Sentiment Analysis**: Analyzes user emotions and adjusts responses accordingly
- **Coping Strategies**: Provides evidence-based techniques for anxiety, depression, and stress
- **Escalation**: Recommends professional help when appropriate

### Assessment Tools
- **PHQ-9**: 9-item depression screening with automatic scoring
- **GAD-7**: 7-item anxiety assessment with severity levels
- **Progress Tracking**: Monitor mental health trends over time
- **Personalized Recommendations**: Tailored suggestions based on results

### Privacy & Security
- **End-to-end Encryption**: All data is encrypted in transit and at rest
- **Anonymous Interactions**: Users remain anonymous in peer spaces
- **Role-based Access**: Different access levels for students, counselors, and admins
- **Crisis Protocols**: Immediate escalation procedures for safety

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Crisis Resources

If you or someone you know is in crisis:

- **National Suicide Prevention Lifeline**: 988
- **Crisis Text Line**: Text HOME to 741741
- **Emergency Services**: 911
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

## 📞 Support

- **Documentation**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/digital-psychological-intervention-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/digital-psychological-intervention-system/discussions)

## 🙏 Acknowledgments

- Mental health professionals who provided guidance
- Open source libraries and frameworks used
- College counseling centers for feedback
- Students who participated in testing

## 📈 Roadmap

- [ ] Mobile app development
- [ ] Advanced AI features
- [ ] Multi-language support
- [ ] Integration with university systems
- [ ] Advanced analytics dashboard
- [ ] Group therapy features

---

**⚠️ Important Notice**: This system is designed to supplement, not replace, professional mental health care. Always consult with qualified mental health professionals for serious concerns.
