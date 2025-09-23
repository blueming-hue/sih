import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  where,
  updateDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  COLLECTIONS,
  subscribeVolunteers,
  updateVolunteerStatus
} from '../../firebase/firestore';
import {
  Heart,
  Send,
  Star,
  Shield,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const VolunteerChat = () => {
  const { user } = useAuth();
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userAlias, setUserAlias] = useState('');
  const [currentChatId, setCurrentChatId] = useState(null);
  const [pastChats, setPastChats] = useState([]);
  const messagesEndRef = useRef(null);

  // Generate random alias
  const generateAlias = () => {
    const prefixes = ['Student', 'Learner', 'Seeker', 'Traveler', 'Friend'];
    const numbers = Math.floor(Math.random() * 10000);
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${numbers}`;
  };

  // Initialize user alias
  useEffect(() => {
    if (!userAlias) {
      setUserAlias(generateAlias());
    }
  }, [userAlias]);

  // Subscribe to real volunteer data from Firestore
  useEffect(() => {
    const unsubscribe = subscribeVolunteers((volunteersList) => {
      setVolunteers(volunteersList);
    }, (error) => {
      console.error('Error fetching volunteers:', error);
      toast.error('Failed to load volunteers');
    });

    return () => unsubscribe();
  }, []);

  // Listen for past chats
  useEffect(() => {
    if (!user?.uid) return;

    const chatsQuery = query(
      collection(db, COLLECTIONS.VOLUNTEER_CHATS),
      where('studentId', '==', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsList = [];
      snapshot.forEach((doc) => {
        chatsList.push({ id: doc.id, ...doc.data() });
      });
      setPastChats(chatsList);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Listen for messages in current chat
  useEffect(() => {
    if (!currentChatId) return;

    const messagesQuery = query(
      collection(db, `${COLLECTIONS.VOLUNTEER_CHATS}/${currentChatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = [];
      snapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesList);
    });

    return () => unsubscribe();
  }, [currentChatId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChatWithVolunteer = async (volunteer) => {
    try {
      // Check if there's already an active chat with this volunteer
      const existingChatQuery = query(
        collection(db, COLLECTIONS.VOLUNTEER_CHATS),
        where('studentId', '==', user.uid),
        where('volunteerId', '==', volunteer.id),
        where('status', '==', 'active')
      );

      const existingChats = await getDocs(existingChatQuery);

      let chatId;
      if (!existingChats.empty) {
        // Resume existing chat
        chatId = existingChats.docs[0].id;
      } else {
        // Create new chat
        const chatRef = await addDoc(collection(db, COLLECTIONS.VOLUNTEER_CHATS), {
          studentId: user.uid,
          studentAlias: userAlias,
          volunteerId: volunteer.id,
          volunteerName: volunteer.name,
          status: 'active',
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp()
        });
        chatId = chatRef.id;
      }

      setCurrentChatId(chatId);
      setSelectedVolunteer(volunteer);
      toast.success(`Connected with ${volunteer.name}!`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat with volunteer');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChatId) return;

    try {
      await addDoc(collection(db, `${COLLECTIONS.VOLUNTEER_CHATS}/${currentChatId}/messages`), {
        senderId: user.uid,
        senderType: 'student',
        alias: userAlias,
        text: newMessage.trim(),
        timestamp: serverTimestamp()
      });

      // Update last message time
      await updateDoc(doc(db, COLLECTIONS.VOLUNTEER_CHATS, currentChatId), {
        lastMessageAt: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const endChat = async () => {
    if (!currentChatId) return;

    try {
      await updateDoc(doc(db, COLLECTIONS.VOLUNTEER_CHATS, currentChatId), {
        status: 'ended',
        endedAt: serverTimestamp()
      });

      setCurrentChatId(null);
      setSelectedVolunteer(null);
      setMessages([]);
      toast.info('Chat ended');
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reopenChat = (chat) => {
    const volunteer = volunteers.find(v => v.id === chat.volunteerId);
    if (volunteer) {
      setCurrentChatId(chat.id);
      setSelectedVolunteer(volunteer);
    }
  };

  if (currentChatId && selectedVolunteer) {
    return (
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedVolunteer.name}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${selectedVolunteer.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <span>{selectedVolunteer.isOnline ? 'Online' : 'Offline'}</span>
                  <span>•</span>
                  <span>{selectedVolunteer.specialties.join(', ')}</span>
                </div>
              </div>
            </div>
            <button
              onClick={endChat}
              className="btn-secondary text-sm"
            >
              End Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Heart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Start the conversation! {selectedVolunteer.name} is here to help.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderType === 'student'
                      ? 'bg-primary-600 text-white'
                      : 'bg-purple-100 text-purple-900'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {message.senderType === 'student' ? userAlias : selectedVolunteer.name}
                  </div>
                  <div>{message.text}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="flex-1 input-field"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - Volunteers List */}
      <div className="w-96 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-1">Available Volunteers</h3>
          <p className="text-sm text-gray-500">Connect with trained student volunteers</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {volunteers.map((volunteer) => (
            <div
              key={volunteer.id}
              className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => startChatWithVolunteer(volunteer)}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    volunteer.isOnline ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{volunteer.name}</h4>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500">{volunteer.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      volunteer.isOnline
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {volunteer.isOnline ? 'Available' : 'Offline'}
                    </span>
                    <span className="text-xs text-gray-500">{volunteer.totalChats || 0} chats</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {volunteer.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {volunteer.specialties.slice(0, 2).map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        {specialty}
                      </span>
                    ))}
                    {volunteer.specialties.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{volunteer.specialties.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area - Instructions or Past Chats */}
      <div className="flex-1 flex flex-col">
        <div className="p-6">
          <div className="text-center mb-8">
            <Heart className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Connect with a Volunteer
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Our trained student volunteers are here to provide support and guidance.
              Choose a volunteer from the list to start a confidential conversation.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Confidential & Safe</h4>
                <p className="text-sm text-gray-600 mt-1">
                  All conversations are private and secure. Your identity is protected with an alias.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Trained Volunteers</h4>
                <p className="text-sm text-gray-600 mt-1">
                  All volunteers are trained in peer support and mental health first aid.
                </p>
              </div>
            </div>
          </div>

          {/* Past Chats */}
          {pastChats.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Recent Conversations</h4>
              <div className="space-y-3">
                {pastChats.slice(0, 3).map((chat) => (
                  <div
                    key={chat.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => reopenChat(chat)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{chat.volunteerName}</p>
                        <p className="text-sm text-gray-500">
                          {chat.lastMessageAt?.toDate()?.toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        chat.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {chat.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerChat;