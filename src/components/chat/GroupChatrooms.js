import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  COLLECTIONS,
  subscribeChatrooms,
  subscribeRoomPresence,
  updateUserPresence,
  initializeChatrooms
} from '../../firebase/firestore';
import {
  Hash,
  Send,
  Users,
  MessageCircle,
  Heart,
  Brain,
  Book,
  Zap,
  Moon,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

const GroupChatrooms = () => {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState('academics');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userAlias, setUserAlias] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [chatrooms, setChatrooms] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesContainerRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  const chatroomIcons = {
    academics: Book,
    stress: Zap,
    anxiety: Brain,
    depression: Heart,
    selfharm: User,
    relationships: Users,
    sleep: Moon
  };

  const chatroomColors = {
    academics: 'blue',
    stress: 'yellow',
    anxiety: 'purple',
    depression: 'green',
    selfharm: 'red',
    relationships: 'pink',
    sleep: 'indigo'
  };

  // Generate random alias
  const generateAlias = () => {
    const adjectives = ['Kind', 'Brave', 'Gentle', 'Strong', 'Wise', 'Caring', 'Bright', 'Calm'];
    const nouns = ['Helper', 'Friend', 'Supporter', 'Listener', 'Guide', 'Companion', 'Ally', 'Star'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adj}${noun}${number}`;
  };

  // Initialize user alias
  useEffect(() => {
    if (!userAlias) {
      setUserAlias(generateAlias());
    }
  }, [userAlias]);

  // Initialize chatrooms and subscribe to metadata
  useEffect(() => {
    const initAndSubscribe = async () => {
      try {
        // Initialize chatrooms if needed
        if (!isInitialized) {
          await initializeChatrooms();
          setIsInitialized(true);
        }

        // Subscribe to chatroom metadata
        const unsubscribe = subscribeChatrooms((rooms) => {
          setChatrooms(rooms.map(room => ({
            ...room,
            icon: chatroomIcons[room.id] || MessageCircle,
            color: chatroomColors[room.id] || 'blue'
          })));
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing chatrooms:', error);
        // Fallback to empty array if there's an error
        setChatrooms([]);
      }
    };

    const unsubscribe = initAndSubscribe();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isInitialized]);

  // Update user presence when room changes
  useEffect(() => {
    if (user?.uid && selectedRoom) {
      updateUserPresence(user.uid, true, selectedRoom).catch(console.error);
    }

    // Cleanup on unmount
    return () => {
      if (user?.uid) {
        updateUserPresence(user.uid, false, null).catch(console.error);
      }
    };
  }, [user?.uid, selectedRoom]);

  // Subscribe to room presence
  useEffect(() => {
    if (!selectedRoom) return;

    const unsubscribe = subscribeRoomPresence(selectedRoom, (count) => {
      setOnlineCount(count);
    });

    return () => unsubscribe();
  }, [selectedRoom]);

  // Listen for messages in selected room
  useEffect(() => {
    if (!selectedRoom) return;

    const messagesQuery = query(
      collection(db, `${COLLECTIONS.CHATROOMS}/${selectedRoom}/messages`),
      orderBy('timestamp', 'desc'),
      limit(50) // Reduced limit for better performance
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = [];
      snapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() });
      });
      // Reverse to show newest at bottom
      setMessages(messagesList.reverse());
    });

    return () => unsubscribe();
  }, [selectedRoom]);

  // Smart auto scroll - only scroll the messages container, not the whole page
  useEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0) return;

    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Auto-scroll if user is near bottom, just sent a message, or it's the first message
    if (isNearBottom || shouldAutoScroll.current || messages.length === 1) {
      // Scroll the container to the bottom, not the whole page
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
      shouldAutoScroll.current = false;
    }
  }, [messages]);

  // Handle scroll to detect if user is manually scrolling
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;

    if (isAtBottom) {
      shouldAutoScroll.current = true;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      await addDoc(collection(db, `${COLLECTIONS.CHATROOMS}/${selectedRoom}/messages`), {
        senderId: user.uid,
        alias: userAlias,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        room: selectedRoom
      });

      setNewMessage('');

      // Enable auto-scroll for user's own message
      shouldAutoScroll.current = true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[color] || colors.blue;
  };

  const selectedRoomData = chatrooms.find(room => room.id === selectedRoom);
  const RoomIcon = selectedRoomData?.icon || MessageCircle;

  // Handle room selection
  const handleRoomSelect = (roomId) => {
    setSelectedRoom(roomId);
    setMessages([]); // Clear messages when switching rooms
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Room List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-1">Support Chatrooms</h3>
          <p className="text-sm text-gray-500">Choose a topic to join the conversation</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatrooms.map((room) => {
            const Icon = room.icon;
            return (
              <button
                key={room.id}
                onClick={() => handleRoomSelect(room.id)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedRoom === room.id ? 'bg-primary-50 border-primary-200' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getColorClasses(room.color)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 text-sm">{room.name}</h4>
                      {selectedRoom === room.id && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {room.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{userAlias}</p>
              <p className="text-xs text-gray-500">Your anonymous identity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getColorClasses(selectedRoomData?.color)}`}>
                <RoomIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  #{selectedRoomData?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedRoomData?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{onlineCount} online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isConsecutive = index > 0 &&
                messages[index - 1].senderId === message.senderId &&
                message.timestamp?.toMillis() - messages[index - 1].timestamp?.toMillis() < 60000;

              return (
                <div key={message.id} className={`${isConsecutive ? 'mt-1' : 'mt-4'}`}>
                  {!isConsecutive && (
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                        {message.alias?.[0] || 'U'}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {message.alias || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.timestamp?.toDate()?.toLocaleTimeString() || ''}
                      </span>
                    </div>
                  )}
                  <div className="ml-8">
                    <p className="text-gray-800">{message.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Hash className="w-4 h-4" />
              <span>{selectedRoomData?.name}</span>
            </div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message #${selectedRoomData?.name}...`}
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
    </div>
  );
};

export default GroupChatrooms;