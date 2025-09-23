import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Heart,
  MessageCircle,
  Star,
  Users,
  Clock,
  CheckCircle,
  Settings
} from 'lucide-react';
import {
  subscribeVolunteerChats,
  updateVolunteerStatus,
  subscribeVolunteers
} from '../../firebase/firestore';
import toast from 'react-hot-toast';

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [activeChats, setActiveChats] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({
    totalChats: 0,
    rating: 0,
    thisWeekChats: 0
  });

  // Find volunteer profile
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeVolunteers((volunteers) => {
      const profile = volunteers.find(v => v.userId === user.uid);
      if (profile) {
        setVolunteerProfile(profile);
        setIsOnline(profile.isOnline || false);
        setStats({
          totalChats: profile.totalChats || 0,
          rating: profile.rating || 0,
          thisWeekChats: profile.thisWeekChats || 0
        });
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Subscribe to volunteer chats
  useEffect(() => {
    if (!volunteerProfile?.id) return;

    // Note: This would need a custom query for volunteer chats
    // For now, we'll use a placeholder
    setActiveChats([]);
  }, [volunteerProfile?.id]);

  const handleStatusToggle = async () => {
    if (!volunteerProfile?.id) return;

    try {
      const newStatus = !isOnline;
      await updateVolunteerStatus(volunteerProfile.id, newStatus, true);
      setIsOnline(newStatus);
      toast.success(newStatus ? 'You are now online and available' : 'You are now offline');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (!volunteerProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Volunteer Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            Your volunteer profile hasn't been set up yet. Please contact an administrator to get started.
          </p>
          <button className="btn-primary">
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Volunteer Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {volunteerProfile.name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isOnline ? 'Available' : 'Offline'}
              </span>
            </div>
            <button
              onClick={handleStatusToggle}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isOnline
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Chats</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChats}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.rating.toFixed(1)} ⭐
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeekChats}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Chats</p>
              <p className="text-2xl font-bold text-gray-900">{activeChats.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{volunteerProfile.name}</h3>
                <p className="text-sm text-gray-600">Volunteer</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Specialties</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {volunteerProfile.specialties?.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Experience</p>
                <p className="text-sm text-gray-900 mt-1">{volunteerProfile.experience}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-sm text-gray-900 mt-1">{volunteerProfile.description}</p>
              </div>

              {volunteerProfile.certifications && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Certifications</p>
                  <ul className="text-sm text-gray-900 mt-1 space-y-1">
                    {volunteerProfile.certifications.map((cert, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Chats */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Active Chats</h3>

            {activeChats.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Chats</h4>
                <p className="text-gray-600">
                  {isOnline
                    ? "You're online and ready to help students. Chats will appear here when students connect with you."
                    : "Go online to start accepting chat requests from students who need support."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeChats.map((chat) => (
                  <div key={chat.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{chat.studentAlias}</h4>
                        <p className="text-sm text-gray-600">
                          Started {chat.createdAt?.toDate()?.toLocaleTimeString()}
                        </p>
                      </div>
                      <button className="btn-primary text-sm">
                        Continue Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;