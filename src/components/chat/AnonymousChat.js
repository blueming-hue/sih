import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  where,
  updateDoc,
  setDoc,
  runTransaction,
  getDocs,
  limit
} from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { COLLECTIONS } from '../../firebase/firestore';
import {
  Search,
  MessageCircle,
  UserPlus,
  X,
  Send,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  validateMessage,
  checkForInappropriateContent,
  filterMessage,
  shouldBlockMessage,
  shouldFlagForReview,
  getCrisisResources
} from '../../utils/messageValidation';

const AnonymousChat = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle'); // 'idle', 'searching', 'connected'
  const [currentMatch, setCurrentMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userAlias, setUserAlias] = useState('');
  const [partnerAlias, setPartnerAlias] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  // Generate random alias
  const generateAlias = () => {
    const colors = ['Blue', 'Green', 'Purple', 'Orange', 'Pink', 'Yellow', 'Red', 'Teal'];
    const animals = ['Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Lion', 'Owl', 'Deer', 'Cat', 'Dog'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(Math.random() * 100);
    return `${color}${animal}${number}`;
  };

  // Initialize user alias
  useEffect(() => {
    if (!userAlias) {
      setUserAlias(generateAlias());
    }
  }, [userAlias]);

  // Listen for current match
  useEffect(() => {
    if (!user?.uid) return;

    const userMatchQuery = query(
      collection(db, COLLECTIONS.MATCHES),
      where('participants', 'array-contains', user.uid),
      where('active', '==', true) // Only listen to active matches
    );

    const unsubscribe = onSnapshot(
      userMatchQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const matchDoc = snapshot.docs[0];
          const matchData = { id: matchDoc.id, ...matchDoc.data() };

          // Only set as current match if it's truly active
          if (matchData.active) {
            setCurrentMatch(matchData);
            setStatus('connected');

            // Set partner alias
            const partnerUid = matchData.participants.find(p => p !== user.uid);
            const partnerAliasFromDoc = matchData.aliases[partnerUid];
            if (partnerAliasFromDoc) {
              setPartnerAlias(partnerAliasFromDoc);
            }
          } else {
            // Match exists but is inactive - clean up
            setCurrentMatch(null);
            setStatus('idle');
            setMessages([]);
            setPartnerAlias('');
          }
        } else {
          // No active matches found
          setCurrentMatch(null);
          if (status === 'connected') {
            setStatus('idle');
            setMessages([]);
            setPartnerAlias('');
            toast.success('Chat ended. You can start a new one!');
          }
        }
      },
      (error) => {
        console.error('Error listening to matches:', error);
        if (error.code === 'permission-denied') {
          toast.error('Permission denied. Please check your authentication.');
        } else if (error.code === 'unavailable') {
          toast.error('Connection lost. Trying to reconnect...');
        }
      }
    );

    return () => unsubscribe();
  }, [user?.uid, status]);

  // Listen for messages in current match
  useEffect(() => {
    if (!currentMatch?.id) return;

    const messagesQuery = query(
      collection(db, `${COLLECTIONS.MATCHES}/${currentMatch.id}/messages`),
      orderBy('timestamp', 'asc'),
      limit(50) // Limit for performance
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesList = [];
        snapshot.forEach((doc) => {
          messagesList.push({ id: doc.id, ...doc.data() });
        });
        setMessages(messagesList);
      },
      (error) => {
        console.error('Error listening to messages:', error);
        if (error.code === 'permission-denied') {
          toast.error('Cannot access messages. Please try reconnecting.');
        }
      }
    );

    return () => unsubscribe();
  }, [currentMatch?.id]);

  // Listen for partner typing status
  useEffect(() => {
    if (!currentMatch?.id || !user?.uid) return;

    const partnerUid = currentMatch.participants.find(p => p !== user.uid);
    if (!partnerUid) return;

    const typingDocRef = doc(db, `${COLLECTIONS.MATCHES}/${currentMatch.id}/typing`, partnerUid);

    const unsubscribe = onSnapshot(
      typingDocRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const isRecentlyTyping = data.timestamp &&
            Date.now() - data.timestamp.toMillis() < 5000; // 5 second timeout
          setPartnerTyping(data.isTyping && isRecentlyTyping);
        } else {
          setPartnerTyping(false);
        }
      },
      (error) => {
        console.warn('Error listening to typing status:', error);
        setPartnerTyping(false);
      }
    );

    return () => unsubscribe();
  }, [currentMatch?.id, user?.uid]);

  // Smart auto scroll - only scroll the messages container, not the whole page
  useEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0) return;

    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Auto-scroll if:
    // 1. User is near the bottom (within 100px)
    // 2. shouldAutoScroll flag is true (user just sent a message)
    // 3. It's the first message in a new chat
    if (isNearBottom || shouldAutoScroll.current || messages.length === 1) {
      // Scroll the container to the bottom, not the whole page
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
      shouldAutoScroll.current = false; // Reset the flag
    }
  }, [messages]);

  // Handle scroll to detect if user is manually scrolling
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;

    // If user scrolled to bottom, enable auto-scroll for new messages
    if (isAtBottom) {
      shouldAutoScroll.current = true;
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Clear typing status if user leaves the page
      if (currentMatch?.id && user?.uid) {
        updateTypingStatus(false).catch(console.warn);
      }
    };
  }, [currentMatch?.id, user?.uid]);

  const startSearching = async () => {
    if (!user?.uid) {
      toast.error('Please log in to start chatting');
      return;
    }

    if (!userAlias) {
      toast.error('Generating your chat alias...');
      return;
    }

    try {
      setStatus('searching');

      // Add user to waiting queue with retry logic
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          await setDoc(doc(db, COLLECTIONS.WAITING_QUEUE, user.uid), {
            userId: user.uid,
            alias: userAlias,
            timestamp: serverTimestamp(),
            looking: true
          });
          break; // Success
        } catch (queueError) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw queueError;
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }

      // Try to find a match
      await tryToMatch();

    } catch (error) {
      console.error('Error starting search:', error);
      if (error.code === 'permission-denied') {
        toast.error('You don\'t have permission to use the chat system');
      } else if (error.code === 'unavailable') {
        toast.error('Chat service is temporarily unavailable. Please try again.');
      } else {
        toast.error('Failed to start searching. Please check your connection.');
      }
      setStatus('idle');
    }
  };

  const tryToMatch = async () => {
    try {
      // Simple approach: find any available partner and create match
      const waitingQuery = query(
        collection(db, COLLECTIONS.WAITING_QUEUE),
        where('looking', '==', true),
        limit(10) // Limit results for better performance
      );

      const waitingSnapshot = await getDocs(waitingQuery);

      // Find a partner (exclude current user)
      let partnerData = null;
      waitingSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId !== user.uid && !partnerData) {
          partnerData = data;
        }
      });

      if (partnerData) {
        try {
          // Simple match creation without complex transactions
          const matchRef = await addDoc(collection(db, COLLECTIONS.MATCHES), {
            participants: [user.uid, partnerData.userId],
            aliases: {
              [user.uid]: userAlias,
              [partnerData.userId]: partnerData.alias
            },
            createdAt: serverTimestamp(),
            active: true
          });

          // Remove both users from queue (best effort)
          try {
            await deleteDoc(doc(db, COLLECTIONS.WAITING_QUEUE, user.uid));
            await deleteDoc(doc(db, COLLECTIONS.WAITING_QUEUE, partnerData.userId));
          } catch (cleanupError) {
            console.warn('Queue cleanup error:', cleanupError);
            // Not critical - the match was created successfully
          }

          toast.success('Match found! Start chatting!');
          return; // Success - stop retrying
        } catch (matchError) {
          console.warn('Match creation error:', matchError);
          // Fall through to retry
        }
      }

      // No partner found or match creation failed, retry
      if (status === 'searching') {
        setTimeout(tryToMatch, 2000); // Retry every 2 seconds
      }
    } catch (error) {
      console.error('Matching error:', error);
      if (status === 'searching') {
        setTimeout(tryToMatch, 3000); // Retry every 3 seconds on error
      }
    }
  };

  const stopSearching = async () => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.WAITING_QUEUE, user.uid));
      setStatus('idle');
      toast.info('Stopped searching for match');
    } catch (error) {
      console.error('Error stopping search:', error);
      // Force state change even if deletion fails
      setStatus('idle');
      toast.warn('Stopped searching (connection error)');
    }
  };

  const leaveChat = async () => {
    try {
      // Clear typing status first
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);

      if (currentMatch?.id) {
        // Update typing status to false before leaving
        try {
          await updateTypingStatus(false);
        } catch (typingError) {
          console.warn('Failed to clear typing status:', typingError);
        }

        // Mark match as inactive
        await updateDoc(doc(db, COLLECTIONS.MATCHES, currentMatch.id), {
          active: false,
          endedAt: serverTimestamp(),
          endedBy: user.uid
        });
      }

      // Clean up local state immediately
      setStatus('idle');
      setCurrentMatch(null);
      setMessages([]);
      setPartnerAlias('');
      setPartnerTyping(false);

      toast.info('Left the chat');
    } catch (error) {
      console.error('Error leaving chat:', error);

      // Force cleanup even if there's an error
      setStatus('idle');
      setCurrentMatch(null);
      setMessages([]);
      setPartnerAlias('');
      setPartnerTyping(false);

      toast.error('Error leaving chat, but you\'ve been disconnected');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentMatch?.id) return;

    const messageText = newMessage.trim();

    // Validate message
    const validation = validateMessage(messageText);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    // Check content
    const contentCheck = checkForInappropriateContent(messageText);

    // Block inappropriate messages
    if (shouldBlockMessage(contentCheck)) {
      toast.error('Your message contains inappropriate content and cannot be sent.');
      return;
    }

    // Show crisis resources if needed
    if (contentCheck.hasCrisisContent) {
      const resources = getCrisisResources();
      toast.error(resources.message, { duration: 10000 });
      // Could also show a modal with resources here
    }

    // Filter the message
    const filteredText = filterMessage(messageText);

    // Optimistic update
    const tempMessage = {
      id: `temp_${Date.now()}`,
      senderId: user.uid,
      alias: userAlias,
      text: filteredText,
      timestamp: { toDate: () => new Date() },
      sending: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    // Enable auto-scroll for user's own message
    shouldAutoScroll.current = true;

    try {
      // Save message with metadata for moderation
      await addDoc(collection(db, `${COLLECTIONS.MATCHES}/${currentMatch.id}/messages`), {
        senderId: user.uid,
        alias: userAlias,
        text: filteredText,
        originalText: messageText !== filteredText ? messageText : null,
        timestamp: serverTimestamp(),
        flagged: shouldFlagForReview(contentCheck),
        contentFlags: contentCheck
      });

      // Remove temp message since real one will come through listener
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));

    } catch (error) {
      console.error('Error sending message:', error);

      // Remove temp message and restore input
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(filteredText);

      if (error.code === 'permission-denied') {
        toast.error('You don\'t have permission to send messages');
      } else if (error.code === 'unavailable') {
        toast.error('Chat service is temporarily unavailable');
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    }
  };

  const addAsPeer = async () => {
    if (!currentMatch || !partnerAlias) return;

    try {
      const partnerUid = currentMatch.participants.find(p => p !== user.uid);

      await addDoc(collection(db, COLLECTIONS.PEERS), {
        userId: user.uid,
        peerUid: partnerUid,
        peerAlias: partnerAlias,
        addedAt: serverTimestamp(),
        fromMatch: currentMatch.id
      });

      toast.success(`Added ${partnerAlias} as a peer!`);
    } catch (error) {
      console.error('Error adding peer:', error);
      toast.error('Failed to add as peer');
    }
  };

  // Handle typing indicators
  const updateTypingStatus = async (typing) => {
    if (!currentMatch?.id || !user?.uid) return;

    try {
      await setDoc(doc(db, `${COLLECTIONS.MATCHES}/${currentMatch.id}/typing`, user.uid), {
        isTyping: typing,
        timestamp: serverTimestamp(),
        alias: userAlias
      });
    } catch (error) {
      console.warn('Failed to update typing status:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicators
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Clear typing status when sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
      updateTypingStatus(false);

      sendMessage();
    }
  };

  if (status === 'idle') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Anonymous 1:1 Chat</h3>
          <p className="text-gray-600 mb-6">
            Connect with another student anonymously. Your alias: <span className="font-semibold text-primary-600">{userAlias}</span>
          </p>
          <button
            onClick={startSearching}
            className="btn-primary flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Find a Chat Partner</span>
          </button>
        </div>
      </div>
    );
  }

  if (status === 'searching') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Looking for a chat partner...</h3>
          <p className="text-gray-600 mb-6">
            We're finding someone who's also looking to chat. This may take a moment.
          </p>
          <button
            onClick={stopSearching}
            className="btn-secondary flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Stop Searching</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Chatting with {partnerAlias}
            </h3>
            <p className="text-sm text-gray-500">
              You: {userAlias} • Anonymous Chat
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={addAsPeer}
              className="btn-secondary text-sm flex items-center space-x-1"
              title="Add as peer for future chats"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Peer</span>
            </button>
            <button
              onClick={leaveChat}
              className="btn-secondary text-sm flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Leave</span>
            </button>
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
            <Heart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Start the conversation! Say hello 👋</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === user.uid
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                } ${message.sending ? 'opacity-60' : ''}`}
              >
                <div className="text-xs opacity-75 mb-1">
                  {message.alias}
                </div>
                <div>{message.text}</div>
                {message.sending && (
                  <div className="text-xs mt-1 opacity-50">Sending...</div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {partnerTyping && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-900">
              <div className="text-xs opacity-75 mb-1">{partnerAlias}</div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
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
};

export default AnonymousChat;