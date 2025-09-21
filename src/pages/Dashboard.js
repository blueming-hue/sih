import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { 
  MessageCircle, 
  Calendar, 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp,
  Heart,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { userData } = useAuth();
  const { assessments, journalEntries } = useUser();
  const [recentActivity, setRecentActivity] = useState([]);

  // Mock data for charts
  const moodData = [
    { name: 'Mon', mood: 7 },
    { name: 'Tue', mood: 6 },
    { name: 'Wed', mood: 8 },
    { name: 'Thu', mood: 5 },
    { name: 'Fri', mood: 7 },
    { name: 'Sat', mood: 9 },
    { name: 'Sun', mood: 8 }
  ];

  const stressLevels = [
    { name: 'Low', value: 45, color: '#10B981' },
    { name: 'Medium', value: 35, color: '#F59E0B' },
    { name: 'High', value: 20, color: '#EF4444' }
  ];

  const quickActions = [
    {
      title: 'Chat with AI',
      description: 'Get immediate support and guidance',
      icon: MessageCircle,
      color: 'bg-blue-500',
      href: '/chatbot'
    },
    {
      title: 'Book Session',
      description: 'Schedule with a counsellor',
      icon: Calendar,
      color: 'bg-green-500',
      href: '/booking'
    },
    {
      title: 'Peer Forum',
      description: 'Connect with other students',
      icon: Users,
      color: 'bg-purple-500',
      href: '/forum'
    },
    {
      title: 'Resources',
      description: 'Access helpful materials',
      icon: BookOpen,
      color: 'bg-orange-500',
      href: '/resources'
    }
  ];

  const stats = [
    {
      title: 'Mood Score',
      value: '7.2',
      change: '+0.3',
      changeType: 'positive',
      icon: Heart,
      color: 'text-green-600'
    },
    {
      title: 'Journal Entries',
      value: journalEntries.length.toString(),
      change: '+2 this week',
      changeType: 'positive',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Chat Sessions',
      value: '12',
      change: '+3 this week',
      changeType: 'positive',
      icon: MessageCircle,
      color: 'text-purple-600'
    },
    {
      title: 'Resources Viewed',
      value: '8',
      change: '+1 today',
      changeType: 'positive',
      icon: BookOpen,
      color: 'text-orange-600'
    }
  ];

  useEffect(() => {
    // Simulate recent activity
    setRecentActivity([
      {
        id: 1,
        type: 'journal',
        message: 'Added a new journal entry',
        time: '2 hours ago',
        icon: FileText
      },
      {
        id: 2,
        type: 'chat',
        message: 'Completed a chat session with AI',
        time: '4 hours ago',
        icon: MessageCircle
      },
      {
        id: 3,
        type: 'resource',
        message: 'Viewed stress management guide',
        time: '1 day ago',
        icon: BookOpen
      },
      {
        id: 4,
        type: 'assessment',
        message: 'Completed PHQ-9 assessment',
        time: '2 days ago',
        icon: CheckCircle
      }
    ]);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {userData?.displayName || 'Student'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome to your mental health dashboard. Here's an overview of your progress and available resources.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <a
                    key={index}
                    href={action.href}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mood Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Trends (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stress Levels */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stress Level Distribution</h3>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="60%" height={150}>
                <PieChart>
                  <Pie
                    data={stressLevels}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {stressLevels.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {stressLevels.map((level, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: level.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{level.name}: {level.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="p-2 bg-white rounded-lg">
                    <Icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wellness Tips */}
      <div className="mt-8">
        <div className="card bg-gradient-to-r from-primary-50 to-secondary-50">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Heart className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Wellness Tip</h3>
              <p className="text-gray-700 mb-3">
                Take a 5-minute break every hour to practice deep breathing. This simple technique can help reduce stress and improve focus throughout your day.
              </p>
              <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                Learn more breathing techniques →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
