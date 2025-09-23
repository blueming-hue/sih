from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore
import json
from datetime import datetime
import logging

# Import custom modules
from chatbot.mental_health_chatbot import MentalHealthChatbot
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
    if os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'):
        cred = credentials.Certificate(json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')))
    else:
        cred = credentials.Certificate('firebase-service-account.json')
    
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger.info("Firebase initialized successfully")
except Exception as e:
    logger.error(f"Firebase initialization failed: {e}")
    db = None

# Initialize AI components
chatbot = MentalHealthChatbot()
assessment = PHQ9GAD7Assessment()

# -------- Counsellor API (server-side with service account) --------
@app.route('/api/counsellor/appointments', methods=['GET'])
def list_counsellor_appointments():
    """
    Returns appointments for a counsellor ordered by date/time.
    Query params: counsellorId=<uid>, limit=<n>
    """
    try:
        counsellor_id = request.args.get('counsellorId', '')
        limit_n = int(request.args.get('limit', '100'))
        if not counsellor_id:
            return jsonify({'error': 'counsellorId is required'}), 400
        if not db:
            return jsonify({'appointments': []})

        # Fetch with where only (no server-side order_by to avoid composite index), then sort in Python
        stream = db.collection('appointments') \
            .where('counsellorId', '==', counsellor_id) \
            .limit(limit_n) \
            .stream()
        items = []
        for doc in stream:
            d = doc.to_dict()
            d['id'] = doc.id
            items.append(d)
        # Sort by date then time client-side
        items.sort(key=lambda x: (str(x.get('appointmentDate') or ''), str(x.get('appointmentTime') or '')))
        return jsonify({'appointments': items})
    except Exception as e:
        logger.error(f"list_counsellor_appointments error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/counsellor/availability/slot', methods=['POST'])
def counsellor_upsert_availability_slot():
    """
    Body: { counsellorId, dateKey, time }
    Creates or updates a slot document to available (booked: False).
    """
    try:
        if not db:
            return jsonify({'error': 'Database not available'}), 500
        data = request.get_json() or {}
        counsellor_id = data.get('counsellorId')
        date_key = data.get('dateKey')
        time = data.get('time')
        if not counsellor_id or not date_key or not time:
            return jsonify({'error': 'counsellorId, dateKey and time are required'}), 400
        ref = db.document(f"counsellors/{counsellor_id}/availability/{date_key}/slots/{time}")
        ref.set({'time': time, 'booked': False, 'updatedAt': datetime.now()}, merge=True)
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"upsert_availability_slot error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/counsellor/appointments/<appointment_id>/status', methods=['PATCH'])
def counsellor_update_status(appointment_id):
    """
    Body: { status: 'approved'|'pending'|'cancelled'|'canceled', counsellorId: '<uid>' }
    """
    try:
        if not db:
            return jsonify({'error': 'Database not available'}), 500
        data = request.get_json() or {}
        status = (data.get('status') or '').lower()
        counsellor_id = data.get('counsellorId')
        if status not in ('pending', 'approved', 'confirmed', 'cancelled', 'canceled'):
            return jsonify({'error': 'Invalid status'}), 400
        if not counsellor_id:
            return jsonify({'error': 'counsellorId is required'}), 400

        ref = db.collection('appointments').document(appointment_id)
        snap = ref.get()
        if not snap.exists:
            return jsonify({'error': 'Not found'}), 404
        appt = snap.to_dict()
        if appt.get('counsellorId') != counsellor_id:
            return jsonify({'error': 'Not your appointment'}), 403
        ref.update({'status': status, 'updatedAt': datetime.now()})
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"counsellor_update_status error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/counsellor/appointments/<appointment_id>/reschedule', methods=['PATCH'])
def counsellor_reschedule(appointment_id):
    """
    Body: { appointmentDate: 'YYYY-MM-DD', appointmentTime: 'HH:mm', counsellorId: '<uid>' }
    """
    try:
        if not db:
            return jsonify({'error': 'Database not available'}), 500
        data = request.get_json() or {}
        new_date = data.get('appointmentDate')
        new_time = data.get('appointmentTime')
        counsellor_id = data.get('counsellorId')
        if not new_date or not new_time:
            return jsonify({'error': 'appointmentDate and appointmentTime required'}), 400
        if not counsellor_id:
            return jsonify({'error': 'counsellorId is required'}), 400
        ref = db.collection('appointments').document(appointment_id)
        snap = ref.get()
        if not snap.exists:
            return jsonify({'error': 'Not found'}), 404
        appt = snap.to_dict()
        if appt.get('counsellorId') != counsellor_id:
            return jsonify({'error': 'Not your appointment'}), 403
        ref.update({'appointmentDate': new_date, 'appointmentTime': new_time, 'updatedAt': datetime.now()})
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"counsellor_reschedule error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/counsellor/availability/toggle', methods=['PATCH'])
def counsellor_toggle_availability():
    """
    Body: { counsellorId, dateKey, time, active }
    """
    try:
        if not db:
            return jsonify({'error': 'Database not available'}), 500
        data = request.get_json() or {}
        counsellor_id = data.get('counsellorId')
        date_key = data.get('dateKey')
        time = data.get('time')
        active = bool(data.get('active'))
        if not counsellor_id or not date_key or not time:
            return jsonify({'error': 'counsellorId, dateKey and time are required'}), 400
        ref = db.document(f"counsellors/{counsellor_id}/availability/{date_key}/slots/{time}")
        # Ensure doc exists
        if not ref.get().exists:
            ref.set({'time': time, 'booked': False})
        ref.update({'active': active, 'updatedAt': datetime.now()})
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"toggle_availability error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/counsellor/availability', methods=['GET'])
def counsellor_get_availability():
    """
    Query params: counsellorId=<uid>, dateKey=YYYY-MM-DD
    Returns available slots list for the given counsellor and date.
    """
    try:
        if not db:
            return jsonify({'error': 'Database not available'}), 500
        counsellor_id = request.args.get('counsellorId', '')
        date_key = request.args.get('dateKey', '')
        if not counsellor_id or not date_key:
            return jsonify({'error': 'counsellorId and dateKey are required'}), 400
        col = db.collection(f"counsellors/{counsellor_id}/availability/{date_key}/slots")
        snap = col.stream()
        items = []
        for d in snap:
            data = d.to_dict() or {}
            data['id'] = d.id
            items.append(data)
        # normalize and sort by time
        def norm_time(t):
            t = str(t or '').strip().replace('.', ':')
            return t
        for it in items:
            it['time'] = norm_time(it.get('time') or it['id'])
        items.sort(key=lambda x: str(x.get('time') or ''))
        return jsonify({'slots': items})
    except Exception as e:
        logger.error(f"get_availability error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/counsellor/appointments/<appointment_id>/notes/<counsellor_id>', methods=['GET'])
def counsellor_get_note(appointment_id, counsellor_id):
    try:
        if not db:
            return jsonify({'error': 'Database not available'}), 500
        ref = db.document(f"appointments/{appointment_id}/notes/{counsellor_id}")
        snap = ref.get()
        if not snap.exists:
            return jsonify({'note': None})
        data = snap.to_dict() or {}
        data['id'] = snap.id
        return jsonify({'note': data})
    except Exception as e:
        logger.error(f"get_note error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/counsellor/appointments/<appointment_id>/notes/<counsellor_id>', methods=['PUT'])
def counsellor_put_note(appointment_id, counsellor_id):
    try:
        if not db:
            return jsonify({'error': 'Database not available'}), 500
        body = request.get_json() or {}
        text = body.get('text', '')
        ref = db.document(f"appointments/{appointment_id}/notes/{counsellor_id}")
        ref.set({'text': text, 'updatedAt': datetime.now()}, merge=True)
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"put_note error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'firebase': db is not None,
            'chatbot': True
        }
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        user_id = data.get('user_id', '')
        session_id = data.get('session_id', '')

        if not user_message:
            return jsonify({'error': 'Message is required'}), 400

        ai_response = chatbot.generate_response(user_message)

        if db and session_id:
            try:
                conversation_data = {
                    'user_id': user_id,
                    'session_id': session_id,
                    'user_message': user_message,
                    'ai_response': ai_response.get('ai_reply', ai_response.get('response', '')),
                    'sentiment': ai_response.get('sentiment', {}),
                    'timestamp': datetime.now(),
                    'escalation_level': ai_response.get('escalation_level', 'low')
                }
                db.collection('chat_conversations').add(conversation_data)
            except Exception as e:
                logger.error(f"Failed to save conversation: {e}")

        return jsonify(ai_response)

    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/assessment/phq9', methods=['POST'])
def phq9_assessment():
    try:
        data = request.get_json()
        responses = data.get('responses', [])
        user_id = data.get('user_id', '')

        if len(responses) != 9:
            return jsonify({'error': 'PHQ-9 requires exactly 9 responses'}), 400

        result = assessment.calculate_phq9_score(responses)

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
    try:
        data = request.get_json()
        responses = data.get('responses', [])
        user_id = data.get('user_id', '')

        if len(responses) != 7:
            return jsonify({'error': 'GAD-7 requires exactly 7 responses'}), 400

        result = assessment.calculate_gad7_score(responses)

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
    try:
        data = request.get_json()
        user_id = data.get('user_id', '')
        escalation_level = data.get('escalation_level', 'high')
        message = data.get('message', '')

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
    try:
        user_id = request.args.get('user_id', '')
        if not db:
            return jsonify({'error': 'Database not available'}), 500

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
                'sentiment': conv_data.get('sentiment', {}).get('label', 'neutral'),
                'score': conv_data.get('sentiment', {}).get('score', 0)
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