import re
import random
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class MentalHealthChatbot:
    """
    AI-powered mental health chatbot that provides support, coping strategies,
    and escalation recommendations based on user input and sentiment analysis.
    """
    
    def __init__(self):
        self.crisis_keywords = [
            'suicide', 'kill myself', 'end it all', 'not worth living',
            'want to die', 'hurt myself', 'self harm', 'cut myself',
            'overdose', 'jump off', 'hang myself', 'end my life'
        ]
        
        self.anxiety_keywords = [
            'anxious', 'anxiety', 'worried', 'worry', 'panic', 'nervous',
            'stressed', 'stress', 'overwhelmed', 'fear', 'scared', 'afraid'
        ]
        
        self.depression_keywords = [
            'depressed', 'depression', 'sad', 'hopeless', 'empty', 'worthless',
            'guilty', 'tired', 'exhausted', 'no energy', 'can\'t sleep',
            'sleeping too much', 'no appetite', 'eating too much'
        ]
        
        self.sleep_keywords = [
            'sleep', 'insomnia', 'can\'t sleep', 'tired', 'exhausted',
            'sleeping too much', 'nightmares', 'night terrors'
        ]
        
        self.academic_keywords = [
            'exam', 'test', 'assignment', 'deadline', 'grades', 'fail',
            'academic', 'study', 'college', 'university', 'course'
        ]
        
        # Response templates
        self.responses = {
            'crisis': {
                'immediate': [
                    "I'm very concerned about what you're telling me. Your safety is the most important thing right now. Please reach out for immediate help:",
                    "I can hear that you're in a lot of pain right now. Please know that you're not alone and there are people who want to help you:",
                    "What you're experiencing sounds very serious. Your life has value and there are resources available to support you:"
                ],
                'resources': [
                    "• National Suicide Prevention Lifeline: 988 (available 24/7)",
                    "• Crisis Text Line: Text HOME to 741741",
                    "• Emergency Services: 911",
                    "• Go to your nearest emergency room",
                    "• Contact a trusted friend or family member immediately"
                ]
            },
            'anxiety': {
                'coping': [
                    "I understand you're feeling anxious. Here are some immediate techniques that can help:",
                    "Anxiety can feel overwhelming, but there are effective strategies to manage it:",
                    "Let's work through some anxiety management techniques together:"
                ],
                'techniques': [
                    "1. **Deep Breathing**: Try the 4-7-8 technique - inhale for 4 counts, hold for 7, exhale for 8",
                    "2. **Grounding Exercise**: Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste",
                    "3. **Progressive Muscle Relaxation**: Tense and release each muscle group from toes to head",
                    "4. **Mindfulness**: Focus on your breath and observe thoughts without judgment",
                    "5. **Physical Activity**: Take a short walk or do some gentle stretching"
                ]
            },
            'depression': {
                'support': [
                    "I'm sorry you're feeling this way. Depression can make everything feel overwhelming, but you're taking an important step by reaching out.",
                    "What you're experiencing sounds really difficult. Remember that these feelings are temporary and you're not alone in this.",
                    "I can hear the pain in your words. It takes courage to share these feelings, and I want you to know that help is available."
                ],
                'strategies': [
                    "1. **Small Steps**: Focus on one small task at a time rather than everything at once",
                    "2. **Routine**: Try to maintain a basic daily routine, even if it's just getting up and having a meal",
                    "3. **Social Connection**: Reach out to someone you trust, even if it's just a brief conversation",
                    "4. **Physical Care**: Try to get some sunlight, eat regular meals, and maintain basic hygiene",
                    "5. **Professional Help**: Consider speaking with a counselor or therapist who can provide specialized support"
                ]
            },
            'sleep': {
                'advice': [
                    "Sleep issues can really impact your mental health and daily functioning. Here are some evidence-based strategies:",
                    "Good sleep is crucial for mental health. Let's work on improving your sleep hygiene:",
                    "Sleep problems are common and treatable. Here are some techniques that can help:"
                ],
                'tips': [
                    "1. **Consistent Schedule**: Go to bed and wake up at the same time every day, even on weekends",
                    "2. **Bedroom Environment**: Keep your room cool, dark, and quiet",
                    "3. **Screen Time**: Avoid screens 1 hour before bed - the blue light disrupts melatonin",
                    "4. **Caffeine**: Avoid caffeine after 2 PM",
                    "5. **Relaxation Routine**: Develop a calming bedtime routine like reading or gentle music",
                    "6. **Limit Naps**: Keep naps to 20-30 minutes and avoid late afternoon naps"
                ]
            },
            'academic': {
                'support': [
                    "Academic stress is very common among students. Let's work on some strategies to manage this:",
                    "I understand how overwhelming academic pressure can feel. Here are some ways to cope:",
                    "Academic challenges can feel insurmountable, but there are effective ways to manage them:"
                ],
                'strategies': [
                    "1. **Time Management**: Break large tasks into smaller, manageable chunks",
                    "2. **Study Techniques**: Use active learning methods like summarizing, teaching others, or practice tests",
                    "3. **Stress Management**: Take regular breaks and use relaxation techniques",
                    "4. **Seek Support**: Talk to professors, academic advisors, or tutoring services",
                    "5. **Realistic Goals**: Set achievable goals and celebrate small victories",
                    "6. **Balance**: Make time for activities you enjoy outside of academics"
                ]
            },
            'general': {
                'support': [
                    "Thank you for sharing that with me. I'm here to listen and support you.",
                    "I appreciate you opening up about what you're going through. Let's work through this together.",
                    "It takes courage to reach out for help. I'm glad you're taking this step."
                ],
                'suggestions': [
                    "Would you like to talk more about what's on your mind?",
                    "Is there a specific area where you'd like some support or guidance?",
                    "How can I best help you right now?",
                    "Would you like to try some coping strategies together?"
                ]
            }
        }
    
    def get_response(self, user_message: str, sentiment_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate an appropriate response based on user message and sentiment analysis.
        
        Args:
            user_message: The user's input message
            sentiment_result: Sentiment analysis results
            
        Returns:
            Dictionary containing response, escalation level, and suggestions
        """
        try:
            message_lower = user_message.lower()
            
            # Check for crisis indicators
            if self._detect_crisis(message_lower):
                return self._generate_crisis_response()
            
            # Determine primary concern based on keywords
            concern_type = self._identify_concern_type(message_lower)
            
            # Generate appropriate response
            response_data = self._generate_response(concern_type, sentiment_result)
            
            # Determine escalation level
            escalation_level = self._determine_escalation_level(sentiment_result, concern_type)
            
            return {
                'response': response_data['response'],
                'escalation_level': escalation_level,
                'suggestions': response_data['suggestions'],
                'crisis_detected': False,
                'concern_type': concern_type
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return self._generate_fallback_response()
    
    def _detect_crisis(self, message: str) -> bool:
        """Detect if the message contains crisis indicators."""
        for keyword in self.crisis_keywords:
            if keyword in message:
                return True
        return False
    
    def _identify_concern_type(self, message: str) -> str:
        """Identify the primary type of mental health concern."""
        concern_scores = {
            'anxiety': sum(1 for keyword in self.anxiety_keywords if keyword in message),
            'depression': sum(1 for keyword in self.depression_keywords if keyword in message),
            'sleep': sum(1 for keyword in self.sleep_keywords if keyword in message),
            'academic': sum(1 for keyword in self.academic_keywords if keyword in message)
        }
        
        if max(concern_scores.values()) > 0:
            return max(concern_scores, key=concern_scores.get)
        return 'general'
    
    def _generate_crisis_response(self) -> Dict[str, Any]:
        """Generate response for crisis situations."""
        immediate_response = random.choice(self.responses['crisis']['immediate'])
        resources = '\n'.join(self.responses['crisis']['resources'])
        
        response = f"{immediate_response}\n\n{resources}\n\nPlease reach out for help immediately. Your safety is the most important thing right now."
        
        return {
            'response': response,
            'escalation_level': 'critical',
            'suggestions': ['Contact emergency services', 'Call crisis hotline', 'Go to emergency room'],
            'crisis_detected': True,
            'concern_type': 'crisis'
        }
    
    def _generate_response(self, concern_type: str, sentiment_result: Dict[str, Any]) -> Dict[str, Any]:
        """Generate response based on concern type and sentiment."""
        if concern_type == 'anxiety':
            return self._generate_anxiety_response()
        elif concern_type == 'depression':
            return self._generate_depression_response()
        elif concern_type == 'sleep':
            return self._generate_sleep_response()
        elif concern_type == 'academic':
            return self._generate_academic_response()
        else:
            return self._generate_general_response()
    
    def _generate_anxiety_response(self) -> Dict[str, Any]:
        """Generate response for anxiety concerns."""
        coping_intro = random.choice(self.responses['anxiety']['coping'])
        techniques = '\n\n'.join(self.responses['anxiety']['techniques'])
        
        response = f"{coping_intro}\n\n{techniques}\n\nWould you like me to guide you through any of these techniques right now?"
        
        return {
            'response': response,
            'suggestions': [
                'Try deep breathing exercise',
                'Practice grounding technique',
                'Book a session with counselor',
                'Access anxiety resources'
            ]
        }
    
    def _generate_depression_response(self) -> Dict[str, Any]:
        """Generate response for depression concerns."""
        support_intro = random.choice(self.responses['depression']['support'])
        strategies = '\n\n'.join(self.responses['depression']['strategies'])
        
        response = f"{support_intro}\n\nHere are some strategies that might help:\n\n{strategies}\n\nIf these feelings persist or feel overwhelming, I strongly recommend speaking with a professional counselor. Would you like help finding support?"
        
        return {
            'response': response,
            'suggestions': [
                'Book a counseling session',
                'Try self-care strategies',
                'Access depression resources',
                'Talk to someone you trust'
            ]
        }
    
    def _generate_sleep_response(self) -> Dict[str, Any]:
        """Generate response for sleep concerns."""
        advice_intro = random.choice(self.responses['sleep']['advice'])
        tips = '\n\n'.join(self.responses['sleep']['tips'])
        
        response = f"{advice_intro}\n\n{tips}\n\nWould you like a guided relaxation exercise to help you fall asleep?"
        
        return {
            'response': response,
            'suggestions': [
                'Try sleep meditation',
                'Practice relaxation techniques',
                'Create sleep schedule',
                'Book a session with counselor'
            ]
        }
    
    def _generate_academic_response(self) -> Dict[str, Any]:
        """Generate response for academic stress."""
        support_intro = random.choice(self.responses['academic']['support'])
        strategies = '\n\n'.join(self.responses['academic']['strategies'])
        
        response = f"{support_intro}\n\n{strategies}\n\nRemember, it's okay to ask for help with academics. Many students face similar challenges."
        
        return {
            'response': response,
            'suggestions': [
                'Create study schedule',
                'Talk to academic advisor',
                'Access study resources',
                'Book a counseling session'
            ]
        }
    
    def _generate_general_response(self) -> Dict[str, Any]:
        """Generate general supportive response."""
        support_intro = random.choice(self.responses['general']['support'])
        suggestions = random.choice(self.responses['general']['suggestions'])
        
        response = f"{support_intro} {suggestions}"
        
        return {
            'response': response,
            'suggestions': [
                'Talk about your feelings',
                'Try coping strategies',
                'Book a counseling session',
                'Access mental health resources'
            ]
        }
    
    def _determine_escalation_level(self, sentiment_result: Dict[str, Any], concern_type: str) -> str:
        """Determine the appropriate escalation level."""
        sentiment_score = sentiment_result.get('score', 0)
        
        # Critical escalation for very negative sentiment
        if sentiment_score < -0.7:
            return 'high'
        
        # High escalation for negative sentiment with serious concerns
        if sentiment_score < -0.4 and concern_type in ['depression', 'crisis']:
            return 'high'
        
        # Medium escalation for moderate negative sentiment
        if sentiment_score < -0.2:
            return 'medium'
        
        # Low escalation for mild concerns
        return 'low'
    
    def _generate_fallback_response(self) -> Dict[str, Any]:
        """Generate fallback response when other methods fail."""
        return {
            'response': "I'm here to listen and support you. Could you tell me more about what's on your mind? I can help with stress management, anxiety, sleep issues, or connect you with professional support if needed.",
            'escalation_level': 'low',
            'suggestions': [
                'Share your feelings',
                'Try coping strategies',
                'Book a counseling session',
                'Access resources'
            ],
            'crisis_detected': False,
            'concern_type': 'general'
        }
