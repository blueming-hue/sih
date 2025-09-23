import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createChatSession, sendChatMessage } from '../firebase/firestore';
import { 
  Send, 
  Bot, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const Chatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false); // New state
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

  // Initialize chat session and show welcome once per session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const result = await createChatSession({
          userId: user.uid,
          type: 'ai_chatbot',
          status: 'active'
        });

        if (result.success && !hasShownWelcome) {
          setSessionId(result.id);

          const welcomeMessage = {
            id: 'welcome',
            text: `Hello! I'm your AI mental health assistant. I'm here to provide support and guidance.\n
Here are some helpful things to get you started:\n
• General support and tips for mental well-being\n
• Crisis resources if you ever feel unsafe or in distress\n
• Regular check-ins to help you stay on track\n\n
How are you feeling today?`,
            sender: 'bot',
            timestamp: new Date(),
            type: 'welcome',
            suggestions: ['I feel stressed', 'I feel sad', 'I have sleep issues', 'I need help']
          };

          setMessages([welcomeMessage]);
          setHasShownWelcome(true);
        }
      } catch (error) {
        console.error('Error initializing chat session:', error);
        toast.error('Failed to initialize chat session');
      }
    };

    if (user) {
      initializeSession();
    }
  }, [user, hasShownWelcome]);

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
    // Save user message to Firestore
    await sendChatMessage({
      sessionId,
      text: inputMessage,
      sender: 'user',
      userId: user.uid
    });

    // Call Python backend
    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: inputMessage, userId: user.uid, session_id: sessionId })
    });

    const data = await response.json();

    // **Filter out repeated general support messages**
    let botText = data.ai_reply;
    let botSuggestions = data.sentiment?.recommendations || [];

    if (messages.some(msg => msg.type === 'welcome')) {
      // If the welcome has already been shown, remove any repetitive content
      botText = botText.replace(/General support.*|Provide resources.*|Regular check-ins.*/gs, '').trim();
      botSuggestions = botSuggestions.filter(s => !['General support and monitoring', 'Provide resources for future reference', 'Regular check-ins recommended'].includes(s));
    }

    const botMessage = {
      id: (Date.now() + 1).toString(),
      text: botText,
      sender: 'bot',
      timestamp: new Date(),
      type: data.sentiment?.label || 'general',
      suggestions: botSuggestions
    };

    setMessages(prev => [...prev, botMessage]);

    // Save bot response to Firestore
    await sendChatMessage({
      sessionId,
      text: botMessage.text,
      sender: 'bot',
      userId: user.uid,
      messageType: botMessage.type
    });

    setIsLoading(false);
    setIsTyping(false);

  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
    setIsLoading(false);
    setIsTyping(false);
  }
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
                  {message.sender === 'bot' && <Bot className="w-4 h-4 mt-1 flex-shrink-0" />}
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
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;