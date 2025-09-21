import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getAssessments, getJournalEntries } from '../firebase/firestore';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const { user, userData } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user-specific data
  useEffect(() => {
    if (user && userData?.role === 'student') {
      loadUserData();
    }
  }, [user, userData]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load assessments
      const assessmentsResult = await getAssessments(user.uid);
      if (assessmentsResult.success) {
        setAssessments(assessmentsResult.data);
      }

      // Load journal entries
      const journalResult = await getJournalEntries(user.uid);
      if (journalResult.success) {
        setJournalEntries(journalResult.data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAssessment = (assessment) => {
    setAssessments(prev => [assessment, ...prev]);
  };

  const addJournalEntry = (entry) => {
    setJournalEntries(prev => [entry, ...prev]);
  };

  const updateJournalEntry = (entryId, updates) => {
    setJournalEntries(prev => 
      prev.map(entry => 
        entry.id === entryId ? { ...entry, ...updates } : entry
      )
    );
  };

  const deleteJournalEntry = (entryId) => {
    setJournalEntries(prev => prev.filter(entry => entry.id !== entryId));
  };

  const value = {
    assessments,
    journalEntries,
    loading,
    loadUserData,
    addAssessment,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
