from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
import json
from datetime import datetime
import logging

# Import our custom modules
from chatbot.mental_health_chatbot import MentalHealthChatbot
from sentiment.sentiment_analyzer import SentimentAnalyzer
from assessment.phq9_gad7 import PHQ9GAD7Assessment

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase
try:
    # Use service account key file or environment variable
    if os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'):
        cred = credentials.Certificate(json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')))
    else:
        # Fallback to service account file
        cred = credentials.Certificate('firebase-service-account.json')
    
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger.info("Firebase initialized successfully")
except Exception as e:
    logger.error(f"Firebase initialization failed: {e}")
    db = None

# Initialize AI components
chatbot = MentalHealthChatbot()
sentiment_analyzer = SentimentAnalyzer()
assessment = PHQ9GAD7Assessment()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'firebase': db is not None,
            'chatbot': True,
            'sentiment_analyzer': True
        }
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint for AI chatbot"""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        user_id = data.get('user_id', '')
        session_id = data.get('session_id', '')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Analyze sentiment
        sentiment_result = sentiment_analyzer.analyze(user_message)
        
        # Get AI response
        ai_response = chatbot.get_response(user_message, sentiment_result)
        
        # Save conversation to Firebase
        if db and session_id:
            try:
                conversation_data = {
                    'user_id': user_id,
                    'session_id': session_id,
                    'user_message': user_message,
                    'ai_response': ai_response['response'],
                    'sentiment': sentiment_result,
                    'timestamp': datetime.now(),
                    'escalation_level': ai_response.get('escalation_level', 'low')
                }
                
                db.collection('chat_conversations').add(conversation_data)
            except Exception as e:
                logger.error(f"Failed to save conversation: {e}")
        
        return jsonify({
            'response': ai_response['response'],
            'sentiment': sentiment_result,
            'escalation_level': ai_response.get('escalation_level', 'low'),
            'suggestions': ai_response.get('suggestions', []),
            'crisis_detected': ai_response.get('crisis_detected', False)
        })
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/sentiment', methods=['POST'])
def analyze_sentiment():
    """Analyze sentiment of text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        result = sentiment_analyzer.analyze(text)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/assessment/phq9', methods=['POST'])
def phq9_assessment():
    """PHQ-9 Depression Assessment"""
    try:
        data = request.get_json()
        responses = data.get('responses', [])
        user_id = data.get('user_id', '')
        
        if len(responses) != 9:
            return jsonify({'error': 'PHQ-9 requires exactly 9 responses'}), 400
        
        result = assessment.calculate_phq9_score(responses)
        
        # Save assessment to Firebase
        if db and user_id:
            try:
                assessment_data = {
                    'user_id': user_id,
                    'type': 'PHQ-9',
                    'responses': responses,
                    'score': result['score'],
                    'severity': result['severity'],
                    'recommendations': result['recommendations'],
                    'timestamp': datetime.now()
                }
                
                db.collection('assessments').add(assessment_data)
            except Exception as e:
                logger.error(f"Failed to save PHQ-9 assessment: {e}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"PHQ-9 assessment error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/assessment/gad7', methods=['POST'])
def gad7_assessment():
    """GAD-7 Anxiety Assessment"""
    try:
        data = request.get_json()
        responses = data.get('responses', [])
        user_id = data.get('user_id', '')
        
        if len(responses) != 7:
            return jsonify({'error': 'GAD-7 requires exactly 7 responses'}), 400
        
        result = assessment.calculate_gad7_score(responses)
        
        # Save assessment to Firebase
        if db and user_id:
            try:
                assessment_data = {
                    'user_id': user_id,
                    'type': 'GAD-7',
                    'responses': responses,
                    'score': result['score'],
                    'severity': result['severity'],
                    'recommendations': result['recommendations'],
                    'timestamp': datetime.now()
                }
                
                db.collection('assessments').add(assessment_data)
            except Exception as e:
                logger.error(f"Failed to save GAD-7 assessment: {e}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"GAD-7 assessment error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/escalation', methods=['POST'])
def handle_escalation():
    """Handle crisis escalation"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', '')
        escalation_level = data.get('escalation_level', 'high')
        message = data.get('message', '')
        
        # Log escalation
        if db and user_id:
            try:
                escalation_data = {
                    'user_id': user_id,
                    'escalation_level': escalation_level,
                    'message': message,
                    'timestamp': datetime.now(),
                    'status': 'pending'
                }
                
                db.collection('escalations').add(escalation_data)
            except Exception as e:
                logger.error(f"Failed to save escalation: {e}")
        
        # Return crisis resources
        crisis_resources = {
            'emergency_contacts': [
                {'name': 'National Suicide Prevention Lifeline', 'number': '988'},
                {'name': 'Crisis Text Line', 'number': 'Text HOME to 741741'},
                {'name': 'Emergency Services', 'number': '911'}
            ],
            'immediate_actions': [
                'Contact emergency services if in immediate danger',
                'Reach out to a trusted friend or family member',
                'Go to the nearest emergency room',
                'Use crisis text line for immediate support'
            ]
        }
        
        return jsonify({
            'escalation_logged': True,
            'crisis_resources': crisis_resources
        })
        
    except Exception as e:
        logger.error(f"Escalation error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/analytics/sentiment-trends', methods=['GET'])
def get_sentiment_trends():
    """Get sentiment trends for analytics"""
    try:
        user_id = request.args.get('user_id')
        
        if not db:
            return jsonify({'error': 'Database not available'}), 500
        
        # Get recent conversations
        conversations = db.collection('chat_conversations')\
            .where('user_id', '==', user_id)\
            .order_by('timestamp', direction=firestore.Query.DESCENDING)\
            .limit(50)\
            .stream()
        
        sentiment_data = []
        for conv in conversations:
            conv_data = conv.to_dict()
            sentiment_data.append({
                'timestamp': conv_data['timestamp'].isoformat(),
                'sentiment': conv_data['sentiment']['label'],
                'score': conv_data['sentiment']['score']
            })
        
        return jsonify({'sentiment_trends': sentiment_data})
        
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
