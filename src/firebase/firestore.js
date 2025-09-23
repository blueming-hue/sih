import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  setDoc,
  runTransaction,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
  
} from 'firebase/firestore';
import { db, storage } from './config';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  APPOINTMENTS: 'appointments',
  COUNSELLORS: 'counsellors',
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

 

// Real-time resources subscriptions (students + counsellors unified)
export const subscribeResources = (category, onData, onError = console.error, maxItems = 500) => {
  let qRef = query(
    collection(db, COLLECTIONS.RESOURCES),
    limit(maxItems)
  );
  if (category) {
    qRef = query(
      collection(db, COLLECTIONS.RESOURCES),
      where('category', '==', category),
      limit(maxItems)
    );
  }
  return onSnapshot(
    qRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data(), __src: 'global' }));
      // Sort client-side by createdAt desc if present
      items.sort((a,b)=>{
        const ad = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bd = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bd - ad;
      });
      onData(items);
    },
    (err) => onError(err)
  );
};

export const subscribeCounsellorResourcesAll = (onData, onError = console.error, maxItems = 500) => {
  const qRef = query(collection(db, 'resources_counsellors'), limit(maxItems));
  return onSnapshot(
    qRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data(), __src: 'counsellor' }));
      items.sort((a,b)=>{
        const ad = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bd = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bd - ad;
      });
      onData(items);
    },
    (err) => onError(err)
  );
};

// Combined subscription: merges global resources and counsellor-owned resources
export const subscribeUnifiedResources = (category, onData, onError = console.error) => {
  let globalItems = [];
  let counsellorItems = [];
  const emit = () => {
    let merged = [...globalItems, ...counsellorItems];
    if (category) {
      merged = merged.filter(r => (r.category || null) === category || r.__src === 'counsellor');
      // Note: counsellor items may not have category; include them regardless
    }
    // Dedupe by (title+url) to avoid duplicates
    const seen = new Set();
    const uniq = [];
    for (const it of merged) {
      const key = `${it.title||''}|${it.url||''}|${it.__src}`;
      if (!seen.has(key)) { seen.add(key); uniq.push(it); }
    }
    // Sort newest first by createdAt
    uniq.sort((a,b)=>{
      const ad = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bd = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bd - ad;
    });
    onData(uniq);
  };

  const unsubGlobal = subscribeResources(category, (items)=>{ globalItems = items; emit(); }, onError);
  const unsubCoun = subscribeCounsellorResourcesAll((items)=>{ counsellorItems = items; emit(); }, onError);
  return () => { unsubGlobal && unsubGlobal(); unsubCoun && unsubCoun(); };
};

// Update appointment status (counsellor or student per rules)
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, appointmentId), {
      status,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const rescheduleAppointment = async (appointmentId, { appointmentDate, appointmentTime }) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, appointmentId), {
      appointmentDate,
      appointmentTime,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Toggle availability slot 'active' flag by counsellor
// (moved to bottom section: see Counsellor-specific helpers)

// Subscribe counsellor appointments 
export const subscribeCounsellorAppointments = (counsellorId, onData, onError = console.error, upcomingOnly = true, maxItems = 200) => {
  if (!counsellorId) return () => {};
  const clauses = [where('counsellorId', '==', counsellorId), orderBy('appointmentDate', 'asc'), limit(maxItems)];
  const qRef = query(collection(db, COLLECTIONS.APPOINTMENTS), ...clauses);
  return onSnapshot(qRef, (snap)=>{
    let items = []; snap.forEach(d=>items.push({ id: d.id, ...d.data() }));
    if (upcomingOnly) {
      const todayISO = new Date().toISOString().split('T')[0];
      items = items.filter(a => a.appointmentDate >= todayISO);
    }
    onData(items);
  }, onError);
};

// ===== Counsellor profile helpers =====
export const subscribeCounsellorProfile = (counsellorId, onData, onError = console.error) => {
  if (!counsellorId) return () => {};
  const ref = doc(db, COLLECTIONS.COUNSELLORS, counsellorId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) onData({ id: snap.id, ...snap.data() });
    else onData(null);
  }, onError);
};

export const updateCounsellorProfile = async (counsellorId, data) => {
  try {
    // Ensure counsellors cannot change 'active' from client call
    const { active, userId, email, createdAt, ...safe } = data || {};
    await updateDoc(doc(db, COLLECTIONS.COUNSELLORS, counsellorId), safe);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ===== Admin: Overview & Management Helpers =====
export const getAdminOverviewCounts = async () => {
  try {
    const studentsSnap = await getDocs(query(collection(db, 'students'), limit(1_000))); // soft cap
    const counsellorsSnap = await getDocs(query(collection(db, COLLECTIONS.COUNSELLORS), limit(1_000)));
    const today = new Date(); today.setHours(0,0,0,0);
    const todayISO = today.toISOString().split('T')[0];
    const apptsSnap = await getDocs(query(
      collection(db, COLLECTIONS.APPOINTMENTS),
      where('appointmentDate', '>=', todayISO),
      orderBy('appointmentDate', 'asc'),
      limit(1_000)
    ));
    const pendingApprovalsSnap = await getDocs(query(
      collection(db, COLLECTIONS.COUNSELLORS),
      where('active', '==', false),
      limit(1_000)
    ));
    const sessionsTodaySnap = await getDocs(query(
      collection(db, COLLECTIONS.CHAT_SESSIONS),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      limit(1_000)
    ));
    return {
      success: true,
      data: {
        totalStudents: studentsSnap.size,
        totalCounsellors: counsellorsSnap.size,
        upcomingAppointments: apptsSnap.size,
        pendingCounsellors: pendingApprovalsSnap.size,
        activeSessionsToday: sessionsTodaySnap.size,
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeAppointments = (filters, onData, onError = console.error, maxItems = 200) => {
  let clauses = [];
  clauses.push(orderBy('appointmentDate', 'asc'));
  if (filters?.counsellorId) clauses.unshift(where('counsellorId', '==', filters.counsellorId));
  if (filters?.studentId) clauses.unshift(where('studentId', '==', filters.studentId));
  // Note: Firestore requires appropriate indexes for combined where+orderBy
  const qRef = query(collection(db, COLLECTIONS.APPOINTMENTS), ...clauses, limit(maxItems));
  return onSnapshot(qRef, (snap)=>{
    const items = []; snap.forEach(d=>items.push({ id: d.id, ...d.data() })); onData(items);
  }, onError);
};

export const searchStudents = async (searchTerm = '', maxItems = 200) => {
  try {
    // Simple approach: fetch recent and filter client-side for demo purposes
    const snap = await getDocs(query(collection(db, 'students'), orderBy('createdAt', 'desc'), limit(maxItems)));
    let items = []; snap.forEach(d=>items.push({ id: d.id, ...d.data() }));
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      items = items.filter(s =>
        (s.collegeEmail || '').toLowerCase().includes(q) ||
        (s.collegeName || '').toLowerCase().includes(q) ||
        (s.userId || '').toLowerCase().includes(q)
      );
    }
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Forum moderation
export const subscribeFlaggedPosts = (onData, onError = console.error, maxItems = 200) => {
  const qRef = query(
    collection(db, COLLECTIONS.FORUM_POSTS),
    where('flagged', '==', true),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(qRef, (snap)=>{
    const items = []; snap.forEach(d=>items.push({ id: d.id, ...d.data() })); onData(items);
  }, onError);
};

export const deleteForumPost = async (postId) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.FORUM_POSTS, postId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Toggle counsellor active status (admin use or self-service gated by rules)
export const updateCounsellorActive = async (counsellorId, active) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.COUNSELLORS, counsellorId), { active: !!active });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Upsert a single availability slot
export const upsertAvailabilitySlot = async (counsellorId, dateKey, time, slotOwnerId = null) => {
  try {
    const ownerIdForSlot = slotOwnerId || counsellorId;
    const slotRef = doc(db, `${COLLECTIONS.COUNSELLORS}/${ownerIdForSlot}/availability/${dateKey}/slots/${time}`);
    await setDoc(slotRef, {
      time,
      booked: false,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete a slot (admin/counsellor maintenance)
export const deleteAvailabilitySlot = async (counsellorId, dateKey, time) => {
  try {
    await updateDoc(doc(db, `${COLLECTIONS.COUNSELLORS}/${counsellorId}/availability/${dateKey}/slots/${time}`), {
      // Soft-delete could be implemented; for now, clear to default available
      booked: false,
      bookedBy: null,
      sessionId: null,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
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

// Counsellors: profiles and real-time list
export const subscribeCounsellors = (onData, onError = console.error, maxItems = 100) => {
  // Server-side filter: only active counsellors. Sort client-side to avoid composite index requirements.
  const qRef = query(
    collection(db, COLLECTIONS.COUNSELLORS),
    where('active', '==', true),
    limit(maxItems)
  );
  return onSnapshot(
    qRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      items.sort((a,b)=> (b.rating || 0) - (a.rating || 0));
      onData(items);
    },
    (err) => onError(err)
  );
};

// Admin/all view without active filter
export const subscribeAllCounsellors = (onData, onError = console.error, maxItems = 200) => {
  const qRef = query(
    collection(db, COLLECTIONS.COUNSELLORS),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(
    qRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      onData(items);
    },
    (err) => onError(err)
  );
};

// Each slot doc: { time: 'HH:mm', booked: boolean, bookedBy?: uid, sessionId?: string, updatedAt }
export const subscribeAvailabilitySlots = (counsellorId, dateKey, onData, onError = console.error) => {
  if (!counsellorId || !dateKey) return () => {};
  const toAltDateKey = (dk) => {
    const parts = dk.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD -> DD-MM-YYYY
      if (parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY -> YYYY-MM-DD
    }
    return dk;
  };
  const altDateKey = toAltDateKey(dateKey);
  const col1 = collection(db, `${COLLECTIONS.COUNSELLORS}/${counsellorId}/availability/${dateKey}/slots`);
  const col2 = altDateKey !== dateKey ? collection(db, `${COLLECTIONS.COUNSELLORS}/${counsellorId}/availability/${altDateKey}/slots`) : null;

  const normalizeTime = (raw) => {
    if (!raw) return '';
    let t = String(raw).trim().replace('.', ':');
    const m = t.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (m) {
      let h = parseInt(m[1], 10);
      const mm = m[2];
      const ap = m[3].toUpperCase();
      if (ap === 'PM' && h !== 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2,'0')}:${mm}`;
    }
    const hm = t.match(/^(\d{1,2}):(\d{2})$/);
    if (hm) return `${String(parseInt(hm[1],10)).padStart(2,'0')}:${hm[2]}`;
    return t;
  };

  let last1 = null;
  let last2 = null;
  const emit = () => {
    const items = [];
    const push = (snap) => {
      snap && snap.forEach((d) => {
        const data = d.data();
        const time = normalizeTime(data.time || d.id);
        items.push({ id: d.id, ...data, time });
      });
    };
    push(last1);
    push(last2);
    const seen = new Set();
    const uniq = items.filter(it => {
      if (!it.time) return false;
      if (seen.has(it.time)) return false;
      seen.add(it.time);
      return true;
    });
    const available = uniq.filter(s => (s.active !== false) && !s.booked);
    available.sort((a,b)=> String(a.time).localeCompare(String(b.time)));
    onData(available);
  };

  const u1 = onSnapshot(query(col1), (snap) => { last1 = snap; emit(); }, onError);
  const u2 = col2 ? onSnapshot(query(col2), (snap) => { last2 = snap; emit(); }, onError) : null;
  return () => { u1 && u1(); u2 && u2(); };
};

// Transactional booking to avoid double-booking
export const bookAppointmentWithSlot = async ({
  user,
  counsellorId,
  counsellorName,
  dateKey, // 'YYYY-MM-DD'
  time, // 'HH:mm'
  sessionType,
  reason,
  urgency,
  previousCounseling,
  notes,
  slotOwnerId = null, // if availability is stored under a different owner id (e.g., counsellor auth uid)
}) => {
  try {
    const ownerIdForSlot = slotOwnerId || counsellorId;
    const toAltDateKey = (dk) => {
      const parts = dk.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY->DD
        if (parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD->YYYY
      }
      return dk;
    };
    const altDateKey = toAltDateKey(dateKey);
    const prefRef = doc(db, `${COLLECTIONS.COUNSELLORS}/${ownerIdForSlot}/availability/${dateKey}/slots/${time}`);
    const altRef = altDateKey !== dateKey ? doc(db, `${COLLECTIONS.COUNSELLORS}/${ownerIdForSlot}/availability/${altDateKey}/slots/${time}`) : null;
    const apptRef = doc(collection(db, COLLECTIONS.APPOINTMENTS));

    await runTransaction(db, async (transaction) => {
      let chosenRef = prefRef;
      let slotSnap = await transaction.get(prefRef);
      if (!slotSnap.exists() && altRef) {
        const altSnap = await transaction.get(altRef);
        if (altSnap.exists()) {
          slotSnap = altSnap;
          chosenRef = altRef;
        }
      }
      if (!slotSnap.exists()) throw new Error('Slot not found');
      const slot = slotSnap.data();
      if (slot.booked) throw new Error('Slot already booked');

      // Create appointment
      transaction.set(apptRef, {
        studentId: user.uid,
        studentName: user.displayName || null,
        studentEmail: user.email || null,
        counsellorId,
        counsellorName: counsellorName || null,
        appointmentDate: dateKey,
        appointmentTime: time,
        sessionType,
        duration: '50 minutes',
        status: 'pending',
        reason,
        urgency,
        previousCounseling,
        notes: notes || null,
        createdAt: serverTimestamp()
      });
      // Mark slot booked
      transaction.update(chosenRef, {
        booked: true,
        bookedBy: user.uid,
        sessionId: apptRef.id,
        updatedAt: serverTimestamp()
      });
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Fetch appointments for a user (student or counsellor)
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
    querySnapshot.forEach((d) => appointments.push({ id: d.id, ...d.data() }));
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
      comments: 0,
      likedBy: []
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

// Real-time forum posts subscription (optionally filtered by category)
export const subscribeForumPosts = (category, onData, onError = console.error, maxItems = 50) => {
  // Avoid server-side orderBy to reduce composite index requirements; sort client-side.
  let qRef = query(
    collection(db, COLLECTIONS.FORUM_POSTS),
    limit(maxItems)
  );
  if (category) {
    qRef = query(
      collection(db, COLLECTIONS.FORUM_POSTS),
      where('category', '==', category),
      limit(maxItems)
    );
  }
  return onSnapshot(
    qRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      items.sort((a,b)=>{
        const ad = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bd = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bd - ad;
      });
      onData(items);
    },
    (err) => onError(err)
  );
};

// Toggle like on a forum post for a user. Caller should pass current like state.
export const likeForumPost = async (postId, userId) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.FORUM_POSTS, postId), {
      likedBy: arrayUnion(userId),
      likes: increment(1)
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const unlikeForumPost = async (postId, userId) => {
  try {
    await updateDoc(doc(db, COLLECTIONS.FORUM_POSTS, postId), {
      likedBy: arrayRemove(userId),
      likes: increment(-1)
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Comments subcollection helpers
export const addForumComment = async (postId, comment) => {
  try {
    const commentRef = await addDoc(collection(db, `${COLLECTIONS.FORUM_POSTS}/${postId}/comments`), {
      ...comment,
      createdAt: serverTimestamp()
    });
    // increment comment count on post
    await updateDoc(doc(db, COLLECTIONS.FORUM_POSTS, postId), {
      comments: increment(1)
    });
    return { success: true, id: commentRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeForumComments = (postId, onData, onError = console.error, maxItems = 100) => {
  const qRef = query(
    collection(db, `${COLLECTIONS.FORUM_POSTS}/${postId}/comments`),
    orderBy('createdAt', 'asc'),
    limit(maxItems)
  );
  return onSnapshot(
    qRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      onData(items);
    },
    (err) => onError(err)
  );
};

// Real-time listener for only the comment count (uses snapshot.size)
export const subscribeForumCommentCount = (postId, onCount, onError = console.error) => {
  const qRef = query(
    collection(db, `${COLLECTIONS.FORUM_POSTS}/${postId}/comments`)
  );
  return onSnapshot(
    qRef,
    (snapshot) => {
      onCount(snapshot.size);
    },
    (err) => onError(err)
  );
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

// ===== Counsellor-specific helpers (used by Counsellor Dashboard) =====

// Toggle availability slot 'active' flag by counsellor
export const toggleAvailabilityActive = async (counsellorId, dateKey, time, active) => {
  try {
    await updateDoc(doc(db, `${COLLECTIONS.COUNSELLORS}/${counsellorId}/availability/${dateKey}/slots/${time}`), {
      active: !!active,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Counsellor private notes per appointment
export const upsertCounsellorNote = async (appointmentId, counsellorId, { text }) => {
  try {
    const noteRef = doc(db, `${COLLECTIONS.APPOINTMENTS}/${appointmentId}/notes/${counsellorId}`);
    await setDoc(noteRef, { text: text || '', updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const subscribeCounsellorNotes = (appointmentId, counsellorId, onData, onError = console.error) => {
  if (!appointmentId || !counsellorId) return () => {};
  const noteRef = doc(db, `${COLLECTIONS.APPOINTMENTS}/${appointmentId}/notes/${counsellorId}`);
  return onSnapshot(noteRef, (snap) => {
    onData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  }, onError);
};

// Resources for counsellors (simple collection)
export const getCounsellorResources = async (maxItems = 50) => {
  try {
    const qRef = query(collection(db, 'resources_counsellors'), orderBy('createdAt', 'desc'), limit(maxItems));
    const snap = await getDocs(qRef);
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Counsellor-owned resources CRUD
export const listCounsellorResources = async (ownerId, maxItems = 100) => {
  try {
    const qRef = query(collection(db, 'resources_counsellors'), where('ownerId','==', ownerId), limit(maxItems));
    const snap = await getDocs(qRef);
    const items = []; snap.forEach(d=>items.push({ id: d.id, ...d.data() }));
    items.sort((a,b)=>{
      const ad = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bd = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bd - ad;
    });
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const createCounsellorResource = async (ownerId, { title, url, description = '', type = 'link' }) => {
  try {
    const ref = await addDoc(collection(db, 'resources_counsellors'), {
      ownerId, title, url, description, type,
      createdAt: serverTimestamp()
    });
    return { success: true, id: ref.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateCounsellorResource = async (id, data) => {
  try {
    await updateDoc(doc(db, 'resources_counsellors', id), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteCounsellorResource = async (id) => {
  try {
    await deleteDoc(doc(db, 'resources_counsellors', id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Upload a resource file to Storage and return downloadURL
export const uploadCounsellorResourceFile = async (ownerId, file) => {
  try {
    const path = `resources_counsellors/${ownerId}/${Date.now()}_${file.name}`;
    const r = storageRef(storage, path);
    await uploadBytes(r, file);
    const url = await getDownloadURL(r);
    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
