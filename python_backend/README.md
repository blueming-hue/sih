# Digital Psychological Intervention System - Python Backend

This is the Python backend for the Digital Psychological Intervention System, providing AI-powered mental health support, sentiment analysis, and assessment tools.

## Features

- **AI Mental Health Chatbot**: Provides support, coping strategies, and crisis detection
- **Sentiment Analysis**: Advanced sentiment analysis using multiple approaches
- **PHQ-9 & GAD-7 Assessments**: Standardized mental health screening tools
- **Crisis Detection**: Automatic detection of crisis situations with escalation
- **Firebase Integration**: Secure data storage and real-time updates

## Setup

### Prerequisites

- Python 3.8 or higher
- Firebase project with Firestore enabled
- Virtual environment (recommended)

### Installation

1. **Clone the repository and navigate to the backend directory:**
   ```bash
   cd python_backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download NLTK data:**
   ```bash
   python -c "import nltk; nltk.download('punkt'); nltk.download('vader_lexicon'); nltk.download('stopwords')"
   ```

5. **Set up environment variables:**
   ```bash
   cp env_example.txt .env
   # Edit .env with your configuration
   ```

6. **Set up Firebase:**
   - Create a Firebase project
   - Enable Firestore
   - Generate a service account key
   - Add the key to your `.env` file or place it as `firebase-service-account.json`

### Configuration

Edit the `.env` file with your configuration:

```env
FLASK_ENV=development
PORT=5000
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000
```

## Running the Application

### Development Mode

```bash
python app.py
```

The server will start on `http://localhost:5000`

### Production Mode

```bash
export FLASK_ENV=production
python app.py
```

## API Endpoints

### Health Check
- **GET** `/health` - Check service health

### Chat
- **POST** `/api/chat` - Send message to AI chatbot
  ```json
  {
    "message": "I'm feeling anxious about my exams",
    "user_id": "user123",
    "session_id": "session456"
  }
  ```

### Sentiment Analysis
- **POST** `/api/sentiment` - Analyze text sentiment
  ```json
  {
    "text": "I'm feeling really stressed today"
  }
  ```

### Assessments
- **POST** `/api/assessment/phq9` - PHQ-9 depression assessment
- **POST** `/api/assessment/gad7` - GAD-7 anxiety assessment

### Crisis Management
- **POST** `/api/escalation` - Handle crisis escalation

### Analytics
- **GET** `/api/analytics/sentiment-trends` - Get sentiment trends

## Project Structure

```
python_backend/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── env_example.txt       # Environment variables template
├── README.md             # This file
├── chatbot/
│   └── mental_health_chatbot.py  # AI chatbot logic
├── sentiment/
│   └── sentiment_analyzer.py     # Sentiment analysis
├── assessment/
│   └── phq9_gad7.py             # Assessment tools
└── models/               # Pre-trained models (if any)
```

## Key Components

### Mental Health Chatbot

The chatbot provides:
- Crisis detection and immediate response
- Anxiety management strategies
- Depression support and resources
- Sleep hygiene advice
- Academic stress management
- General mental health support

### Sentiment Analysis

Advanced sentiment analysis using:
- TextBlob for general sentiment
- Mental health-specific keywords
- Crisis indicator detection
- Intensity analysis
- Trend analysis

### Assessment Tools

Standardized mental health assessments:
- **PHQ-9**: 9-item depression screening
- **GAD-7**: 7-item anxiety screening
- Automatic scoring and interpretation
- Risk level determination
- Personalized recommendations

## Security Features

- Input validation and sanitization
- Crisis detection and escalation
- Secure Firebase integration
- CORS configuration
- Error handling and logging

## Deployment

### Local Development
```bash
python app.py
```

### Production Deployment

1. **Using Gunicorn:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. **Using Docker:**
   ```bash
   docker build -t dpis-backend .
   docker run -p 5000:5000 dpis-backend
   ```

3. **Cloud Deployment:**
   - Heroku: Use Procfile with `web: gunicorn app:app`
   - Google Cloud Run: Use cloudbuild.yaml
   - AWS Lambda: Use serverless framework

## Monitoring and Logging

The application includes comprehensive logging:
- Request/response logging
- Error tracking
- Performance monitoring
- Crisis detection alerts

## Testing

Run tests with:
```bash
python -m pytest tests/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Crisis Resources

If you or someone you know is in crisis:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- Emergency Services: 911
