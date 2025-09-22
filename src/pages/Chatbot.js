import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createChatSession, sendChatMessage, subscribeToChatMessages } from '../firebase/firestore';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  AlertTriangle,
  Heart,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const Chatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize chat session
    const initializeSession = async () => {
      try {
        const result = await createChatSession({
          userId: user.uid,
          type: 'ai_chatbot',
          status: 'active'
        });
        
        if (result.success) {
          setSessionId(result.id);
          // Add welcome message
          const welcomeMessage = {
            id: 'welcome',
            text: "Hello! I'm your AI mental health assistant. I'm here to provide support, coping strategies, and guidance. How are you feeling today?",
            sender: 'bot',
            timestamp: new Date(),
            type: 'welcome'
          };
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('Error initializing chat session:', error);
        toast.error('Failed to initialize chat session');
      }
    };

    if (user) {
      initializeSession();
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Send message to Firestore
      await sendChatMessage({
        sessionId,
        text: inputMessage,
        sender: 'user',
        userId: user.uid
      });

      // Simulate AI response (in real implementation, this would call your Python backend)
      setTimeout(async () => {
        const aiResponse = generateAIResponse(inputMessage);
        
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse.text,
          sender: 'bot',
          timestamp: new Date(),
          type: aiResponse.type,
          suggestions: aiResponse.suggestions
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Save bot response to Firestore
        await sendChatMessage({
          sessionId,
          text: aiResponse.text,
          sender: 'bot',
          userId: user.uid,
          messageType: aiResponse.type
        });

        setIsLoading(false);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Simple keyword-based responses (in real implementation, this would be handled by your Python backend)
    if (message.includes('stress') || message.includes('anxious') || message.includes('worried')) {
      return {
        text: "I understand you're feeling stressed or anxious. That's completely normal, especially during college. Here are some immediate coping strategies:\n\n1. Take 5 deep breaths - inhale for 4 counts, hold for 4, exhale for 6\n2. Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste\n3. Take a short walk or do some light stretching\n\nWould you like me to guide you through any of these techniques?",
        type: 'coping_strategy',
        suggestions: ['Breathing exercise', 'Grounding technique', 'Physical activity', 'Book a session']
      };
    }
    
    if (message.includes('sad') || message.includes('depressed') || message.includes('down')) {
      return {
        text: "I'm sorry you're feeling this way. It takes courage to reach out. Remember that these feelings are temporary and you're not alone.\n\nHere are some gentle suggestions:\n\n1. Practice self-compassion - treat yourself as you would a good friend\n2. Engage in activities you used to enjoy, even if you don't feel like it initially\n3. Maintain a basic routine - sleep, meals, and light activity\n4. Consider reaching out to a trusted friend or family member\n\nIf these feelings persist or feel overwhelming, I strongly recommend speaking with a professional counsellor. Would you like help booking a session?",
        type: 'support',
        suggestions: ['Book a session', 'Self-care tips', 'Crisis resources', 'Talk to someone']
      };
    }
    
    if (message.includes('sleep') || message.includes('insomnia') || message.includes('tired')) {
      return {
        text: "Sleep issues can really impact your mental health and academic performance. Here are some evidence-based sleep hygiene tips:\n\n1. Maintain a consistent sleep schedule, even on weekends\n2. Create a relaxing bedtime routine (reading, gentle music, meditation)\n3. Avoid screens 1 hour before bed - the blue light disrupts melatonin\n4. Keep your bedroom cool, dark, and quiet\n5. Avoid caffeine after 2 PM and large meals before bed\n\nWould you like a guided relaxation exercise to help you fall asleep?",
        type: 'sleep_help',
        suggestions: ['Sleep meditation', 'Relaxation exercise', 'Sleep schedule planner', 'Book a session']
      };
    }
    
    if (message.includes('help') || message.includes('crisis') || message.includes('emergency')) {
      return {
        text: "If you're in immediate danger or having thoughts of self-harm, please reach out for help right away:\n\n🚨 Emergency Resources:\n• National Suicide Prevention Lifeline: 988\n• Crisis Text Line: Text HOME to 741741\n• Emergency Services: 911\n\nI'm here to support you, but for immediate safety concerns, please contact these resources or go to your nearest emergency room.\n\nHow can I best support you right now?",
        type: 'crisis_support',
        suggestions: ['Crisis resources', 'Book immediate session', 'Talk to someone', 'Safety planning']
      };
    }
    
    // Default response
    return {
      text: "Thank you for sharing that with me. I'm here to listen and support you. Could you tell me more about what's on your mind? I can help with stress management, anxiety, sleep issues, or connect you with professional support if needed.",
      type: 'general',
      suggestions: ['Stress management', 'Anxiety help', 'Sleep support', 'Book a session']
    };
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Bot className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Mental Health Assistant</h2>
            <p className="text-sm text-gray-600">Available 24/7 for support and guidance</p>
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === 'bot' && (
                    <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    {message.suggestions && (
                      <div className="mt-3 space-y-2">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left px-3 py-2 bg-white bg-opacity-20 rounded-lg text-sm hover:bg-opacity-30 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Crisis Resources */}
      <div className="mt-6 card bg-red-50 border-red-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Crisis Support</h3>
            <p className="text-sm text-red-700 mt-1">
              If you're in immediate danger or having thoughts of self-harm, please reach out for help:
            </p>
            <div className="mt-2 space-y-1 text-sm text-red-700">
              <p>• National Suicide Prevention Lifeline: <strong>988</strong></p>
              <p>• Crisis Text Line: Text <strong>HOME</strong> to 741741</p>
              <p>• Emergency Services: <strong>911</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
