import re
import logging
from typing import Dict, Any, List
from textblob import TextBlob
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import pickle
import os

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('vader_lexicon', quiet=True)
    nltk.download('stopwords', quiet=True)
except:
    pass

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """
    Advanced sentiment analysis for mental health context using multiple approaches.
    """
    
    def __init__(self):
        self.mental_health_keywords = {
            'positive': [
                'happy', 'joy', 'excited', 'grateful', 'hopeful', 'confident',
                'proud', 'accomplished', 'motivated', 'energetic', 'peaceful',
                'calm', 'relaxed', 'content', 'satisfied', 'optimistic'
            ],
            'negative': [
                'sad', 'depressed', 'anxious', 'worried', 'stressed', 'overwhelmed',
                'hopeless', 'worthless', 'guilty', 'ashamed', 'angry', 'frustrated',
                'lonely', 'isolated', 'empty', 'numb', 'tired', 'exhausted'
            ],
            'crisis': [
                'suicide', 'kill', 'die', 'end', 'hurt', 'harm', 'overdose',
                'jump', 'hang', 'cut', 'bleed', 'pain', 'suffering', 'hopeless'
            ]
        }
        
        self.intensity_modifiers = {
            'very': 1.5, 'extremely': 2.0, 'incredibly': 2.0, 'totally': 1.5,
            'completely': 1.5, 'absolutely': 1.5, 'really': 1.2, 'quite': 1.1,
            'somewhat': 0.8, 'slightly': 0.6, 'a bit': 0.7, 'kind of': 0.8
        }
        
        # Initialize models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize sentiment analysis models."""
        try:
            # Try to load pre-trained model
            model_path = 'models/sentiment_model.pkl'
            if os.path.exists(model_path):
                with open(model_path, 'rb') as f:
                    self.model = pickle.load(f)
                logger.info("Loaded pre-trained sentiment model")
            else:
                self.model = None
                logger.info("No pre-trained model found, using rule-based approach")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model = None
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Perform comprehensive sentiment analysis on the given text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary containing sentiment analysis results
        """
        try:
            # Clean and preprocess text
            cleaned_text = self._preprocess_text(text)
            
            # Multiple analysis approaches
            textblob_result = self._analyze_textblob(cleaned_text)
            keyword_result = self._analyze_keywords(cleaned_text)
            crisis_result = self._detect_crisis_indicators(cleaned_text)
            
            # Combine results
            combined_score = self._combine_scores(textblob_result, keyword_result)
            
            # Determine final sentiment
            final_sentiment = self._determine_sentiment(combined_score, crisis_result)
            
            return {
                'text': text,
                'cleaned_text': cleaned_text,
                'label': final_sentiment['label'],
                'score': final_sentiment['score'],
                'confidence': final_sentiment['confidence'],
                'crisis_detected': crisis_result['detected'],
                'crisis_indicators': crisis_result['indicators'],
                'emotional_keywords': keyword_result['keywords'],
                'intensity': final_sentiment['intensity'],
                'recommendations': self._generate_recommendations(final_sentiment, crisis_result)
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return self._get_default_result(text)
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and preprocess text for analysis."""
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.\!\?]', '', text)
        
        return text.strip()
    
    def _analyze_textblob(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment using TextBlob."""
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity  # -1 to 1
            subjectivity = blob.sentiment.subjectivity  # 0 to 1
            
            return {
                'polarity': polarity,
                'subjectivity': subjectivity,
                'confidence': abs(polarity) * (1 - subjectivity)  # Higher confidence for strong, objective sentiment
            }
        except Exception as e:
            logger.error(f"TextBlob analysis error: {e}")
            return {'polarity': 0, 'subjectivity': 0.5, 'confidence': 0}
    
    def _analyze_keywords(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment using mental health keywords."""
        words = text.split()
        positive_count = 0
        negative_count = 0
        total_words = len(words)
        
        # Count positive and negative keywords
        for word in words:
            if word in self.mental_health_keywords['positive']:
                positive_count += 1
            elif word in self.mental_health_keywords['negative']:
                negative_count += 1
        
        # Calculate keyword-based score
        if total_words > 0:
            keyword_score = (positive_count - negative_count) / total_words
        else:
            keyword_score = 0
        
        return {
            'score': keyword_score,
            'positive_count': positive_count,
            'negative_count': negative_count,
            'keywords': {
                'positive': [word for word in words if word in self.mental_health_keywords['positive']],
                'negative': [word for word in words if word in self.mental_health_keywords['negative']]
            }
        }
    
    def _detect_crisis_indicators(self, text: str) -> Dict[str, Any]:
        """Detect crisis indicators in the text."""
        crisis_indicators = []
        words = text.split()
        
        for word in words:
            if word in self.mental_health_keywords['crisis']:
                crisis_indicators.append(word)
        
        # Check for crisis phrases
        crisis_phrases = [
            'want to die', 'kill myself', 'end it all', 'not worth living',
            'hurt myself', 'self harm', 'cut myself', 'overdose'
        ]
        
        for phrase in crisis_phrases:
            if phrase in text:
                crisis_indicators.append(phrase)
        
        return {
            'detected': len(crisis_indicators) > 0,
            'indicators': crisis_indicators,
            'severity': len(crisis_indicators)
        }
    
    def _combine_scores(self, textblob_result: Dict[str, Any], keyword_result: Dict[str, Any]) -> float:
        """Combine scores from different analysis methods."""
        # Weight TextBlob more heavily for general sentiment
        textblob_weight = 0.7
        keyword_weight = 0.3
        
        combined_score = (
            textblob_result['polarity'] * textblob_weight +
            keyword_result['score'] * keyword_weight
        )
        
        return combined_score
    
    def _determine_sentiment(self, combined_score: float, crisis_result: Dict[str, Any]) -> Dict[str, Any]:
        """Determine final sentiment label and intensity."""
        # Override with crisis if detected
        if crisis_result['detected']:
            return {
                'label': 'crisis',
                'score': -1.0,
                'confidence': 0.9,
                'intensity': 'critical'
            }
        
        # Determine sentiment label
        if combined_score >= 0.3:
            label = 'positive'
            intensity = 'high' if combined_score >= 0.7 else 'medium'
        elif combined_score <= -0.3:
            label = 'negative'
            intensity = 'high' if combined_score <= -0.7 else 'medium'
        else:
            label = 'neutral'
            intensity = 'low'
        
        # Calculate confidence
        confidence = min(abs(combined_score) * 1.5, 1.0)
        
        return {
            'label': label,
            'score': combined_score,
            'confidence': confidence,
            'intensity': intensity
        }
    
    def _generate_recommendations(self, sentiment_result: Dict[str, Any], crisis_result: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on sentiment analysis."""
        recommendations = []
        
        if crisis_result['detected']:
            recommendations.extend([
                'Immediate crisis intervention needed',
                'Contact emergency services or crisis hotline',
                'Ensure safety of the individual',
                'Professional mental health support required'
            ])
        elif sentiment_result['label'] == 'negative' and sentiment_result['intensity'] == 'high':
            recommendations.extend([
                'High priority for professional support',
                'Consider immediate counseling session',
                'Monitor for crisis indicators',
                'Provide additional resources and support'
            ])
        elif sentiment_result['label'] == 'negative':
            recommendations.extend([
                'Moderate support needed',
                'Offer coping strategies',
                'Consider counseling referral',
                'Monitor progress'
            ])
        elif sentiment_result['label'] == 'positive':
            recommendations.extend([
                'Continue current support strategies',
                'Encourage positive coping mechanisms',
                'Maintain regular check-ins'
            ])
        else:
            recommendations.extend([
                'General support and monitoring',
                'Provide resources for future reference',
                'Regular check-ins recommended'
            ])
        
        return recommendations
    
    def _get_default_result(self, text: str) -> Dict[str, Any]:
        """Return default result when analysis fails."""
        return {
            'text': text,
            'cleaned_text': text,
            'label': 'neutral',
            'score': 0.0,
            'confidence': 0.0,
            'crisis_detected': False,
            'crisis_indicators': [],
            'emotional_keywords': {'positive': [], 'negative': []},
            'intensity': 'low',
            'recommendations': ['General support and monitoring recommended']
        }
    
    def batch_analyze(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Analyze multiple texts in batch."""
        results = []
        for text in texts:
            results.append(self.analyze(text))
        return results
    
    def get_sentiment_trends(self, analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze sentiment trends over time."""
        if not analyses:
            return {'trend': 'stable', 'average_score': 0, 'volatility': 0}
        
        scores = [analysis['score'] for analysis in analyses]
        labels = [analysis['label'] for analysis in analyses]
        
        # Calculate trend
        if len(scores) >= 2:
            recent_avg = sum(scores[-3:]) / min(3, len(scores))
            older_avg = sum(scores[:-3]) / max(1, len(scores) - 3) if len(scores) > 3 else recent_avg
            
            if recent_avg > older_avg + 0.1:
                trend = 'improving'
            elif recent_avg < older_avg - 0.1:
                trend = 'declining'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        # Calculate volatility
        if len(scores) > 1:
            mean_score = sum(scores) / len(scores)
            variance = sum((score - mean_score) ** 2 for score in scores) / len(scores)
            volatility = variance ** 0.5
        else:
            volatility = 0
        
        return {
            'trend': trend,
            'average_score': sum(scores) / len(scores),
            'volatility': volatility,
            'positive_percentage': labels.count('positive') / len(labels) * 100,
            'negative_percentage': labels.count('negative') / len(labels) * 100,
            'crisis_count': sum(1 for analysis in analyses if analysis['crisis_detected'])
        }