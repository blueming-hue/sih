# chatbot/mental_health_chatbot.py

import requests
from textblob import TextBlob
from sentiment.sentiment_analyzer import SentimentAnalyzer  # import your analyzer

# OpenRouter API info
OPENROUTER_API_KEY = "sk-or-v1-..."  # replace with your key
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

class MentalHealthChatbot:
    def __init__(self, model="openai/gpt-3.5-turbo"):
        self.model = model
        self.analyzer = SentimentAnalyzer()

    def generate_response(self, user_message):
        """
        Generate AI response and enrich it with sentiment insights.
        """
        try:
            # Step 1: Analyze sentiment with SentimentAnalyzer
            analysis = self.analyzer.analyze(user_message)

            # Step 2: Build a system prompt to guide GPT
            system_prompt = (
                "You are a compassionate mental health assistant. "
                "Provide empathetic responses, offer coping strategies, "
                "and escalate if there is a crisis.\n\n"
                f"Sentiment Analysis: {analysis['label']} (Intensity: {analysis['intensity']})\n"
                f"Crisis Detected: {analysis['crisis_detected']}\n"
                f"Recommendations: {', '.join(analysis['recommendations'])}\n"
            )

            # Step 3: Prepare request for OpenRouter
            headers = {
                "Authorization": "Bearer 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",
                "Content-Type": "application/json"
            }
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ]
            }

            # Step 4: Call OpenRouter API
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
            response_json = response.json()
            ai_reply = response_json["choices"][0]["message"]["content"].strip()

            return {
                "user_message": user_message,
                "ai_reply": ai_reply,
                "sentiment": analysis
            }

        except Exception as e:
            # fallback
            return {
                "user_message": user_message,
                "ai_reply": "Sorry, something went wrong. Please try again later.",
                "sentiment": None,
                "error": str(e)
            }

    def provide_coping_strategy(self, sentiment_label):
        """Optional: simple coping strategies based on sentiment label."""
        strategies = {
            "positive": "Keep up the positive vibes! Consider sharing your good mood with others.",
            "neutral": "Feeling neutral is okay. Engage in activities you enjoy.",
            "negative": "Try to take a break, relax, or talk to someone you trust.",
            "crisis": "Immediate professional help is recommended. Contact a counselor or emergency services."
        }
        return strategies.get(sentiment_label.lower(), "Keep going, you're doing great!")