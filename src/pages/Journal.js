import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { createJournalEntry, getJournalEntries } from '../firebase/firestore';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Heart, 
  Search,
  Filter,
  BookOpen,
  TrendingUp,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import toast from 'react-hot-toast';

const Journal = () => {
  const { user } = useAuth();
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useUser();
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  const moodOptions = [
    { value: 'all', label: 'All Moods', icon: Meh },
    { value: '1-3', label: 'Low (1-3)', icon: Frown, color: 'text-red-500' },
    { value: '4-6', label: 'Medium (4-6)', icon: Meh, color: 'text-yellow-500' },
    { value: '7-10', label: 'High (7-10)', icon: Smile, color: 'text-green-500' }
  ];

  const handleCreateEntry = async (entryData) => {
    try {
      const result = await createJournalEntry({
        ...entryData,
        userId: user.uid
      });

      if (result.success) {
        addJournalEntry({ id: result.id, ...entryData });
        toast.success('Journal entry created successfully!');
        setShowCreateEntry(false);
      } else {
        toast.error('Failed to create journal entry');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      toast.error('Error creating journal entry');
    }
  };

  const handleUpdateEntry = async (entryId, updates) => {
    try {
      // In a real app, you'd call an update function here
      updateJournalEntry(entryId, updates);
      toast.success('Journal entry updated successfully!');
      setEditingEntry(null);
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Error updating journal entry');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        // In a real app, you'd call a delete function here
        deleteJournalEntry(entryId);
        toast.success('Journal entry deleted successfully!');
      } catch (error) {
        console.error('Error deleting entry:', error);
        toast.error('Error deleting journal entry');
      }
    }
  };

  const getMoodIcon = (mood) => {
    if (mood >= 7) return <Smile className="w-5 h-5 text-green-500" />;
    if (mood >= 4) return <Meh className="w-5 h-5 text-yellow-500" />;
    return <Frown className="w-5 h-5 text-red-500" />;
  };

  const getMoodColor = (mood) => {
    if (mood >= 7) return 'bg-green-100 text-green-800';
    if (mood >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMood = selectedMood === 'all' || 
                       (selectedMood === '1-3' && entry.mood >= 1 && entry.mood <= 3) ||
                       (selectedMood === '4-6' && entry.mood >= 4 && entry.mood <= 6) ||
                       (selectedMood === '7-10' && entry.mood >= 7 && entry.mood <= 10);
    
    const matchesDate = !selectedDate || (() => {
      try {
        let entryDate;
        if (entry.createdAt?.toDate) {
          entryDate = entry.createdAt.toDate();
        } else if (entry.createdAt) {
          entryDate = new Date(entry.createdAt);
        } else {
          return false;
        }
        
        if (isNaN(entryDate.getTime())) {
          return false;
        }
        
        return entryDate.toISOString().split('T')[0] === selectedDate;
      } catch (error) {
        return false;
      }
    })();
    
    return matchesSearch && matchesMood && matchesDate;
  });

  const averageMood = journalEntries.length > 0 
    ? (journalEntries.reduce((sum, entry) => sum + entry.mood, 0) / journalEntries.length).toFixed(1)
    : 0;

  const recentEntries = journalEntries.slice(0, 5);

  // Helper function to safely format dates
  const formatDate = (dateValue) => {
    try {
      let date;
      if (dateValue?.toDate) {
        date = dateValue.toDate();
      } else if (dateValue) {
        date = new Date(dateValue);
      } else {
        return 'Invalid Date';
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Journal</h1>
            <p className="text-gray-600">
              Track your thoughts, feelings, and progress in your private space
            </p>
          </div>
          <button
            onClick={() => setShowCreateEntry(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{journalEntries.length}</p>
              <p className="text-gray-600">Total Entries</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{averageMood}</p>
              <p className="text-gray-600">Average Mood</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {journalEntries.filter(e => e.mood >= 7).length}
              </p>
              <p className="text-gray-600">Good Days</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(journalEntries.map(e => {
                  try {
                    let date;
                    if (e.createdAt?.toDate) {
                      date = e.createdAt.toDate();
                    } else if (e.createdAt) {
                      date = new Date(e.createdAt);
                    } else {
                      return 'invalid';
                    }
                    
                    if (isNaN(date.getTime())) {
                      return 'invalid';
                    }
                    
                    return date.toISOString().split('T')[0];
                  } catch (error) {
                    return 'invalid';
                  }
                }).filter(date => date !== 'invalid')).size}
              </p>
              <p className="text-gray-600">Active Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Entries
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title or content..."
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Mood Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mood
            </label>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="input-field"
            >
              {moodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Journal Entries */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedMood !== 'all' || selectedDate ? 
                    'Try adjusting your filters' : 
                    'Start your journaling journey by creating your first entry!'
                  }
                </p>
                <button
                  onClick={() => setShowCreateEntry(true)}
                  className="btn-primary"
                >
                  Create First Entry
                </button>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {entry.title}
                        </h3>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${getMoodColor(entry.mood)}`}>
                          {getMoodIcon(entry.mood)}
                          <span>{entry.mood}/10</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">
                        {entry.content}
                      </p>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {entry.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(entry.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Recent Entries */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Entries</h3>
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getMoodIcon(entry.mood)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mood Trends */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Trends</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Mood</span>
                <span className="text-lg font-bold text-gray-900">{averageMood}/10</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Good Days</span>
                <span className="text-lg font-bold text-green-600">
                  {journalEntries.filter(e => e.mood >= 7).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Challenging Days</span>
                <span className="text-lg font-bold text-red-600">
                  {journalEntries.filter(e => e.mood <= 3).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Entry Modal */}
      {(showCreateEntry || editingEntry) && (
        <JournalEntryModal
          entry={editingEntry}
          onClose={() => {
            setShowCreateEntry(false);
            setEditingEntry(null);
          }}
          onSubmit={editingEntry ? handleUpdateEntry : handleCreateEntry}
        />
      )}
    </div>
  );
};

// Journal Entry Modal Component
const JournalEntryModal = ({ entry, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: entry?.title || '',
    content: entry?.content || '',
    mood: entry?.mood || 5,
    tags: entry?.tags?.join(', ') || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const entryData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
    };

    if (entry) {
      onSubmit(entry.id, entryData);
    } else {
      onSubmit(entryData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {entry ? 'Edit Entry' : 'New Journal Entry'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="How are you feeling today?"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood (1-10) *
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.mood}
                onChange={(e) => setFormData({ ...formData, mood: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>1 (Very Low)</span>
                <span className="font-medium text-lg">{formData.mood}</span>
                <span>10 (Very High)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="What's on your mind? How was your day? What are you grateful for?"
                rows={6}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., grateful, stressed, happy, anxious"
                className="input-field"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {entry ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Journal;
