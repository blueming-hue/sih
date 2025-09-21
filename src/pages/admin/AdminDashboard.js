import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  BookOpen, 
  TrendingUp,
  AlertTriangle,
  Heart,
  Activity,
  BarChart3,
  PieChart,
  Clock,
  Shield
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({});

  // Mock analytics data - in real app, this would come from your backend
  const mockAnalytics = {
    totalUsers: 1250,
    activeUsers: 890,
    totalSessions: 3450,
    averageSessionDuration: 25,
    crisisInterventions: 12,
    completedAssessments: 456,
    bookedAppointments: 234,
    forumPosts: 189,
    resourceViews: 1234,
    sentimentTrends: [
      { date: '2024-02-01', positive: 65, negative: 20, neutral: 15 },
      { date: '2024-02-02', positive: 62, negative: 23, neutral: 15 },
      { date: '2024-02-03', positive: 68, negative: 18, neutral: 14 },
      { date: '2024-02-04', positive: 70, negative: 16, neutral: 14 },
      { date: '2024-02-05', positive: 67, negative: 19, neutral: 14 },
      { date: '2024-02-06', positive: 64, negative: 22, neutral: 14 },
      { date: '2024-02-07', positive: 69, negative: 17, neutral: 14 }
    ],
    topConcerns: [
      { concern: 'Academic Stress', count: 45, percentage: 35 },
      { concern: 'Anxiety', count: 38, percentage: 30 },
      { concern: 'Depression', count: 25, percentage: 20 },
      { concern: 'Sleep Issues', count: 15, percentage: 12 },
      { concern: 'Relationship Issues', count: 5, percentage: 3 }
    ],
    userEngagement: {
      dailyActiveUsers: 156,
      weeklyActiveUsers: 890,
      monthlyActiveUsers: 1250,
      averageSessionTime: 25,
      bounceRate: 15
    },
    recentActivity: [
      { id: 1, type: 'crisis', message: 'Crisis intervention triggered', time: '2 minutes ago', severity: 'high' },
      { id: 2, type: 'assessment', message: 'New PHQ-9 assessment completed', time: '5 minutes ago', severity: 'medium' },
      { id: 3, type: 'appointment', message: 'New appointment booked', time: '10 minutes ago', severity: 'low' },
      { id: 4, type: 'forum', message: 'New forum post created', time: '15 minutes ago', severity: 'low' }
    ]
  };

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1000);
  }, []);

  const stats = [
    {
      title: 'Total Users',
      value: analytics.totalUsers?.toLocaleString() || '0',
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Active Sessions',
      value: analytics.totalSessions?.toLocaleString() || '0',
      change: '+8%',
      changeType: 'positive',
      icon: MessageCircle,
      color: 'text-green-600'
    },
    {
      title: 'Crisis Interventions',
      value: analytics.crisisInterventions || '0',
      change: '-2%',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      title: 'Completed Assessments',
      value: analytics.completedAssessments || '0',
      change: '+15%',
      changeType: 'positive',
      icon: Heart,
      color: 'text-purple-600'
    }
  ];

  const pieData = [
    { name: 'Positive', value: 65, color: '#10B981' },
    { name: 'Neutral', value: 20, color: '#6B7280' },
    { name: 'Negative', value: 15, color: '#EF4444' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              System overview and analytics for the Digital Psychological Intervention System
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Admin Access</span>
          </div>
        </div>
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
                    {stat.change} from last week
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
        {/* Main Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sentiment Trends */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Trends (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.sentimentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="positive" stroke="#10B981" strokeWidth={2} name="Positive" />
                <Line type="monotone" dataKey="negative" stroke="#EF4444" strokeWidth={2} name="Negative" />
                <Line type="monotone" dataKey="neutral" stroke="#6B7280" strokeWidth={2} name="Neutral" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Concerns */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Mental Health Concerns</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topConcerns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="concern" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Sentiment Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Sentiment</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Engagement */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Daily Active Users</span>
                <span className="text-lg font-bold text-gray-900">{analytics.userEngagement?.dailyActiveUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Weekly Active Users</span>
                <span className="text-lg font-bold text-gray-900">{analytics.userEngagement?.weeklyActiveUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Session Time</span>
                <span className="text-lg font-bold text-gray-900">{analytics.userEngagement?.averageSessionTime} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bounce Rate</span>
                <span className="text-lg font-bold text-gray-900">{analytics.userEngagement?.bounceRate}%</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {analytics.recentActivity?.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-1 rounded-full ${
                    activity.severity === 'high' ? 'bg-red-100' :
                    activity.severity === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    {activity.type === 'crisis' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {activity.type === 'assessment' && <Heart className="w-4 h-4 text-purple-600" />}
                    {activity.type === 'appointment' && <Calendar className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'forum' && <MessageCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="mt-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">API Status</p>
                <p className="text-sm text-green-600">Operational</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Database</p>
                <p className="text-sm text-green-600">Healthy</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Uptime</p>
                <p className="text-sm text-green-600">99.9%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
