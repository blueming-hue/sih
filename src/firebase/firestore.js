import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  
} from 'firebase/firestore';
import { db } from './config';

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  APPOINTMENTS: 'appointments',
  FORUM_POSTS: 'forum_posts',
  FORUM_COMMENTS: 'forum_comments',
  JOURNAL_ENTRIES: 'journal_entries',
  RESOURCES: 'resources',
  CHAT_SESSIONS: 'chat_sessions',
  CHAT_MESSAGES: 'chat_messages',
  ASSESSMENTS: 'assessments',
  NOTIFICATIONS: 'notifications',
  MOOD_SCORES: 'mood_scores',
  RESOURCES_VIEWED: 'resources_viewed'
};

// Fetch chat sessions for a user
export const getChatSessions = async (userId, maxItems = 20) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CHAT_SESSIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxItems)
    );
    const querySnapshot = await getDocs(q);
    const sessions = [];
    querySnapshot.forEach((doc) => sessions.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: sessions };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time listener for chat sessions
export const subscribeChatSessions = (userId, onData, onError = console.error, maxItems = 20) => {
  const q = query(
    collection(db, COLLECTIONS.CHAT_SESSIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      onData(items);
    },
    (err) => onError(err)
  );
};

// Appointment functions
export const createAppointment = async (appointmentData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.APPOINTMENTS), {
      ...appointmentData,
      createdAt: serverTimestamp(),
      status: 'pending'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAppointments = async (userId, userRole) => {
  try {
    let q;
    if (userRole === 'counsellor') {
      q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('counsellorId', '==', userId),
        orderBy('appointmentDate', 'asc')
      );
    } else {
      q = query(
        collection(db, COLLECTIONS.APPOINTMENTS),
        where('studentId', '==', userId),
        orderBy('appointmentDate', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const appointments = [];
    querySnapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: appointments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Forum functions
export const createForumPost = async (postData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.FORUM_POSTS), {
      ...postData,
      createdAt: serverTimestamp(),
      likes: 0,
      comments: 0
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getForumPosts = async (category = null) => {
  try {
    let q = query(
      collection(db, COLLECTIONS.FORUM_POSTS),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    if (category) {
      q = query(
        collection(db, COLLECTIONS.FORUM_POSTS),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const posts = [];
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: posts };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Journal functions
export const createJournalEntry = async (entryData) => {
  try {
    const payload = { ...entryData };
    // If a valid createdAt Timestamp is provided, use it; otherwise fallback to serverTimestamp
    if (!payload.createdAt) {
      payload.createdAt = serverTimestamp();
    }
    const docRef = await addDoc(collection(db, COLLECTIONS.JOURNAL_ENTRIES), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getJournalEntries = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.JOURNAL_ENTRIES),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: entries };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time listener for journal entries for a user
export const subscribeJournalEntries = (userId, onData, onError = console.error, maxItems = 100) => {
  const q = query(
    collection(db, COLLECTIONS.JOURNAL_ENTRIES),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      onData(items);
    },
    (err) => onError(err)
  );
};

// Resource functions
export const getResources = async (category = null) => {
  try {
    let q = query(
      collection(db, COLLECTIONS.RESOURCES),
      orderBy('createdAt', 'desc')
    );
    
    if (category) {
      q = query(
        collection(db, COLLECTIONS.RESOURCES),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const resources = [];
    querySnapshot.forEach((doc) => {
      resources.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: resources };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Chat functions
export const createChatSession = async (sessionData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.CHAT_SESSIONS), {
      ...sessionData,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendChatMessage = async (messageData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.CHAT_MESSAGES), {
      ...messageData,
      createdAt: serverTimestamp()
    });
    
    // Update last message time in session
    await updateDoc(doc(db, COLLECTIONS.CHAT_SESSIONS, messageData.sessionId), {
      lastMessageAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time listeners
export const subscribeToChatMessages = (sessionId, callback) => {
  const q = query(
    collection(db, COLLECTIONS.CHAT_MESSAGES),
    where('sessionId', '==', sessionId),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};

// Assessment functions
export const saveAssessment = async (assessmentData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ASSESSMENTS), {
      ...assessmentData,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAssessments = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ASSESSMENTS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const assessments = [];
    querySnapshot.forEach((doc) => {
      assessments.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: assessments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Mood score functions
export const addMoodScore = async ({ userId, score, mood, note = null, recordedAt = null }) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.MOOD_SCORES), {
      userId,
      score, // e.g., 0-100 or 1-5 scale
      mood: mood || null, // optional label like 'happy', 'sad'
      note, // optional free text
      recordedAt: recordedAt ? recordedAt : serverTimestamp(),
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMoodScores = async (userId, maxItems = 30) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.MOOD_SCORES),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxItems)
    );
    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time listener for mood scores
export const subscribeMoodScores = (userId, onData, onError = console.error, maxItems = 30) => {
  const q = query(
    collection(db, COLLECTIONS.MOOD_SCORES),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      onData(items);
    },
    (err) => onError(err)
  );
};

// Resources viewed (per-user activity) functions
export const logResourceViewed = async ({ userId, resourceId, resourceType = null, title = null }) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.RESOURCES_VIEWED), {
      userId,
      resourceId, // id from RESOURCES collection or external id
      resourceType, // e.g., article, video
      title,
      viewedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getResourcesViewed = async (userId, maxItems = 50) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.RESOURCES_VIEWED),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxItems)
    );
    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Real-time listener for resources viewed
export const subscribeResourcesViewed = (userId, onData, onError = console.error, maxItems = 50) => {
  const q = query(
    collection(db, COLLECTIONS.RESOURCES_VIEWED),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
      onData(items);
    },
    (err) => onError(err)
  );
};
