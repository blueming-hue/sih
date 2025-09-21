import logging
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class PHQ9GAD7Assessment:
    """
    PHQ-9 (Patient Health Questionnaire-9) and GAD-7 (Generalized Anxiety Disorder-7) 
    assessment tools for mental health screening.
    """
    
    def __init__(self):
        # PHQ-9 questions for depression screening
        self.phq9_questions = [
            "Little interest or pleasure in doing things",
            "Feeling down, depressed, or hopeless",
            "Trouble falling or staying asleep, or sleeping too much",
            "Feeling tired or having little energy",
            "Poor appetite or overeating",
            "Feeling bad about yourself - or that you are a failure or have let yourself or your family down",
            "Trouble concentrating on things, such as reading the newspaper or watching television",
            "Moving or speaking so slowly that other people could have noticed, or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
            "Thoughts that you would be better off dead, or of hurting yourself"
        ]
        
        # GAD-7 questions for anxiety screening
        self.gad7_questions = [
            "Feeling nervous, anxious, or on edge",
            "Not being able to stop or control worrying",
            "Worrying too much about different things",
            "Trouble relaxing",
            "Being so restless that it is hard to sit still",
            "Becoming easily annoyed or irritable",
            "Feeling afraid, as if something awful might happen"
        ]
        
        # Scoring interpretation
        self.phq9_interpretation = {
            (0, 4): {'severity': 'minimal', 'description': 'Minimal depression'},
            (5, 9): {'severity': 'mild', 'description': 'Mild depression'},
            (10, 14): {'severity': 'moderate', 'description': 'Moderate depression'},
            (15, 19): {'severity': 'moderately_severe', 'description': 'Moderately severe depression'},
            (20, 27): {'severity': 'severe', 'description': 'Severe depression'}
        }
        
        self.gad7_interpretation = {
            (0, 4): {'severity': 'minimal', 'description': 'Minimal anxiety'},
            (5, 9): {'severity': 'mild', 'description': 'Mild anxiety'},
            (10, 14): {'severity': 'moderate', 'description': 'Moderate anxiety'},
            (15, 21): {'severity': 'severe', 'description': 'Severe anxiety'}
        }
    
    def calculate_phq9_score(self, responses: List[int]) -> Dict[str, Any]:
        """
        Calculate PHQ-9 depression score and provide interpretation.
        
        Args:
            responses: List of 9 responses (0-3 scale for each question)
            
        Returns:
            Dictionary containing score, severity, and recommendations
        """
        try:
            if len(responses) != 9:
                raise ValueError("PHQ-9 requires exactly 9 responses")
            
            # Validate responses
            for i, response in enumerate(responses):
                if not isinstance(response, int) or response < 0 or response > 3:
                    raise ValueError(f"Invalid response {response} for question {i+1}. Must be 0-3.")
            
            # Calculate total score
            total_score = sum(responses)
            
            # Determine severity
            severity_info = self._get_phq9_severity(total_score)
            
            # Generate recommendations
            recommendations = self._generate_phq9_recommendations(total_score, severity_info)
            
            # Check for suicide risk (question 9)
            suicide_risk = responses[8] > 0  # Question 9 is about suicidal thoughts
            
            return {
                'score': total_score,
                'severity': severity_info['severity'],
                'description': severity_info['description'],
                'suicide_risk': suicide_risk,
                'recommendations': recommendations,
                'individual_scores': responses,
                'assessment_date': datetime.now().isoformat(),
                'assessment_type': 'PHQ-9'
            }
            
        except Exception as e:
            logger.error(f"Error calculating PHQ-9 score: {e}")
            return {
                'error': str(e),
                'score': 0,
                'severity': 'unknown',
                'description': 'Assessment error',
                'recommendations': ['Please retake the assessment']
            }
    
    def calculate_gad7_score(self, responses: List[int]) -> Dict[str, Any]:
        """
        Calculate GAD-7 anxiety score and provide interpretation.
        
        Args:
            responses: List of 7 responses (0-3 scale for each question)
            
        Returns:
            Dictionary containing score, severity, and recommendations
        """
        try:
            if len(responses) != 7:
                raise ValueError("GAD-7 requires exactly 7 responses")
            
            # Validate responses
            for i, response in enumerate(responses):
                if not isinstance(response, int) or response < 0 or response > 3:
                    raise ValueError(f"Invalid response {response} for question {i+1}. Must be 0-3.")
            
            # Calculate total score
            total_score = sum(responses)
            
            # Determine severity
            severity_info = self._get_gad7_severity(total_score)
            
            # Generate recommendations
            recommendations = self._generate_gad7_recommendations(total_score, severity_info)
            
            return {
                'score': total_score,
                'severity': severity_info['severity'],
                'description': severity_info['description'],
                'recommendations': recommendations,
                'individual_scores': responses,
                'assessment_date': datetime.now().isoformat(),
                'assessment_type': 'GAD-7'
            }
            
        except Exception as e:
            logger.error(f"Error calculating GAD-7 score: {e}")
            return {
                'error': str(e),
                'score': 0,
                'severity': 'unknown',
                'description': 'Assessment error',
                'recommendations': ['Please retake the assessment']
            }
    
    def _get_phq9_severity(self, score: int) -> Dict[str, str]:
        """Get PHQ-9 severity level based on score."""
        for (min_score, max_score), info in self.phq9_interpretation.items():
            if min_score <= score <= max_score:
                return info
        return {'severity': 'unknown', 'description': 'Score out of range'}
    
    def _get_gad7_severity(self, score: int) -> Dict[str, str]:
        """Get GAD-7 severity level based on score."""
        for (min_score, max_score), info in self.gad7_interpretation.items():
            if min_score <= score <= max_score:
                return info
        return {'severity': 'unknown', 'description': 'Score out of range'}
    
    def _generate_phq9_recommendations(self, score: int, severity_info: Dict[str, str]) -> List[str]:
        """Generate recommendations based on PHQ-9 score."""
        recommendations = []
        
        if score >= 20:  # Severe depression
            recommendations.extend([
                'Immediate professional intervention recommended',
                'Consider psychiatric evaluation',
                'Regular therapy sessions (weekly or bi-weekly)',
                'Monitor for safety concerns',
                'Consider medication evaluation',
                'Crisis intervention resources available'
            ])
        elif score >= 15:  # Moderately severe
            recommendations.extend([
                'Professional counseling strongly recommended',
                'Consider therapy sessions (weekly)',
                'Monitor symptoms closely',
                'Consider medication evaluation',
                'Develop safety plan if needed'
            ])
        elif score >= 10:  # Moderate
            recommendations.extend([
                'Professional counseling recommended',
                'Consider therapy sessions (bi-weekly)',
                'Learn coping strategies',
                'Monitor symptoms',
                'Consider support groups'
            ])
        elif score >= 5:  # Mild
            recommendations.extend([
                'Self-help strategies and monitoring',
                'Consider brief counseling',
                'Learn stress management techniques',
                'Regular check-ins recommended',
                'Access mental health resources'
            ])
        else:  # Minimal
            recommendations.extend([
                'Continue current self-care practices',
                'Regular mental health check-ins',
                'Access resources for future reference',
                'Maintain healthy lifestyle habits'
            ])
        
        return recommendations
    
    def _generate_gad7_recommendations(self, score: int, severity_info: Dict[str, str]) -> List[str]:
        """Generate recommendations based on GAD-7 score."""
        recommendations = []
        
        if score >= 15:  # Severe anxiety
            recommendations.extend([
                'Immediate professional intervention recommended',
                'Consider psychiatric evaluation',
                'Regular therapy sessions (weekly)',
                'Consider medication evaluation',
                'Learn anxiety management techniques',
                'Crisis intervention resources available'
            ])
        elif score >= 10:  # Moderate anxiety
            recommendations.extend([
                'Professional counseling recommended',
                'Consider therapy sessions (bi-weekly)',
                'Learn anxiety management techniques',
                'Practice relaxation exercises',
                'Consider support groups'
            ])
        elif score >= 5:  # Mild anxiety
            recommendations.extend([
                'Self-help strategies and monitoring',
                'Consider brief counseling',
                'Learn stress management techniques',
                'Practice mindfulness and relaxation',
                'Regular check-ins recommended'
            ])
        else:  # Minimal anxiety
            recommendations.extend([
                'Continue current self-care practices',
                'Regular mental health check-ins',
                'Access resources for future reference',
                'Maintain healthy lifestyle habits'
            ])
        
        return recommendations
    
    def get_assessment_questions(self, assessment_type: str) -> Dict[str, Any]:
        """Get assessment questions for frontend."""
        if assessment_type.lower() == 'phq9':
            return {
                'type': 'PHQ-9',
                'title': 'Depression Screening (PHQ-9)',
                'description': 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
                'scale': {
                    '0': 'Not at all',
                    '1': 'Several days',
                    '2': 'More than half the days',
                    '3': 'Nearly every day'
                },
                'questions': [
                    {'id': 1, 'text': self.phq9_questions[0]},
                    {'id': 2, 'text': self.phq9_questions[1]},
                    {'id': 3, 'text': self.phq9_questions[2]},
                    {'id': 4, 'text': self.phq9_questions[3]},
                    {'id': 5, 'text': self.phq9_questions[4]},
                    {'id': 6, 'text': self.phq9_questions[5]},
                    {'id': 7, 'text': self.phq9_questions[6]},
                    {'id': 8, 'text': self.phq9_questions[7]},
                    {'id': 9, 'text': self.phq9_questions[8]}
                ]
            }
        elif assessment_type.lower() == 'gad7':
            return {
                'type': 'GAD-7',
                'title': 'Anxiety Screening (GAD-7)',
                'description': 'Over the last 2 weeks, how often have you been bothered by the following problems?',
                'scale': {
                    '0': 'Not at all',
                    '1': 'Several days',
                    '2': 'More than half the days',
                    '3': 'Nearly every day'
                },
                'questions': [
                    {'id': 1, 'text': self.gad7_questions[0]},
                    {'id': 2, 'text': self.gad7_questions[1]},
                    {'id': 3, 'text': self.gad7_questions[2]},
                    {'id': 4, 'text': self.gad7_questions[3]},
                    {'id': 5, 'text': self.gad7_questions[4]},
                    {'id': 6, 'text': self.gad7_questions[5]},
                    {'id': 7, 'text': self.gad7_questions[6]}
                ]
            }
        else:
            return {'error': 'Invalid assessment type. Use "phq9" or "gad7".'}
    
    def get_combined_assessment(self, phq9_responses: List[int], gad7_responses: List[int]) -> Dict[str, Any]:
        """Get combined assessment results for both PHQ-9 and GAD-7."""
        try:
            phq9_result = self.calculate_phq9_score(phq9_responses)
            gad7_result = self.calculate_gad7_score(gad7_responses)
            
            # Determine overall risk level
            overall_risk = self._determine_overall_risk(phq9_result, gad7_result)
            
            return {
                'phq9': phq9_result,
                'gad7': gad7_result,
                'overall_risk': overall_risk,
                'combined_recommendations': self._generate_combined_recommendations(phq9_result, gad7_result),
                'assessment_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in combined assessment: {e}")
            return {'error': str(e)}
    
    def _determine_overall_risk(self, phq9_result: Dict[str, Any], gad7_result: Dict[str, Any]) -> str:
        """Determine overall risk level based on both assessments."""
        phq9_severity = phq9_result.get('severity', 'minimal')
        gad7_severity = gad7_result.get('severity', 'minimal')
        
        # High risk if either assessment is severe or if both are moderate+
        if (phq9_severity in ['severe', 'moderately_severe'] or 
            gad7_severity == 'severe' or
            (phq9_severity in ['moderate', 'moderately_severe'] and gad7_severity in ['moderate', 'severe'])):
            return 'high'
        elif (phq9_severity in ['moderate', 'moderately_severe'] or 
              gad7_severity in ['moderate', 'severe']):
            return 'medium'
        else:
            return 'low'
    
    def _generate_combined_recommendations(self, phq9_result: Dict[str, Any], gad7_result: Dict[str, Any]) -> List[str]:
        """Generate combined recommendations based on both assessments."""
        recommendations = []
        
        # Add PHQ-9 specific recommendations
        recommendations.extend(phq9_result.get('recommendations', []))
        
        # Add GAD-7 specific recommendations
        recommendations.extend(gad7_result.get('recommendations', []))
        
        # Remove duplicates and prioritize
        unique_recommendations = list(set(recommendations))
        
        # Prioritize crisis and professional intervention
        priority_keywords = ['immediate', 'professional', 'crisis', 'psychiatric']
        prioritized = []
        others = []
        
        for rec in unique_recommendations:
            if any(keyword in rec.lower() for keyword in priority_keywords):
                prioritized.append(rec)
            else:
                others.append(rec)
        
        return prioritized + others
