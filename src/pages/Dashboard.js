import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { 
  subscribeChatSessions,
  subscribeResourcesViewed
} from '../firebase/firestore';
import { 
  MessageCircle, 
  Calendar, 
  Users, 
  BookOpen, 
  FileText, 
  Heart
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { userData } = useAuth();
  const { journalEntries } = useUser();
  const [recentActivity, setRecentActivity] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [avgMood, setAvgMood] = useState(null);
  const [chatCount, setChatCount] = useState(0);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [rangeDays, setRangeDays] = useState(7); // 7 or 30
  // Config: recent journal entries shown in Recent Activity
  const JOURNAL_RECENT_MODE = 'top3'; // 'top3' | 'single'
  const journalRecentLimit = JOURNAL_RECENT_MODE === 'single' ? 1 : 3;

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
      href: '/chatbot',
      tooltip: 'Open the AI assistant for instant help'
    },
    {
      title: 'Book Session',
      description: 'Schedule with a counsellor',
      icon: Calendar,
      color: 'bg-green-500',
      href: '/booking',
      tooltip: 'Reserve time with a counsellor'
    },
    {
      title: 'Peer Forum',
      description: 'Connect with other students',
      icon: Users,
      color: 'bg-purple-500',
      href: '/forum',
      tooltip: 'Discuss with peers in the forum'
    },
    {
      title: 'Resources',
      description: 'Access helpful materials',
      icon: BookOpen,
      color: 'bg-orange-500',
      href: '/resources',
      tooltip: 'Read and watch curated mental health content'
    }
  ];

  const stats = [
    {
      title: 'Mood Score',
      value: avgMood !== null ? avgMood.toFixed(1) : '-',
      change: '',
      changeType: 'positive',
      icon: Heart,
      color: 'text-green-600'
    },
    {
      title: 'Journal Entries',
      value: (journalEntries?.length || 0).toString(),
      change: '',
      changeType: 'positive',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Chat Sessions',
      value: chatCount.toString(),
      change: '',
      changeType: 'positive',
      icon: MessageCircle,
      color: 'text-purple-600'
    },
    {
      title: 'Resources Viewed',
      value: resourcesCount.toString(),
      change: '',
      changeType: 'positive',
      icon: BookOpen,
      color: 'text-orange-600'
    }
  ];

  // Build chart series from context journal entries whenever they or range changes
  useEffect(() => {
    if (!userData?.uid) return;
    const items = journalEntries || [];
    const computeMoodFromJournals = (items) => {
      const localKey = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`; // local YYYY-MM-DD
      };
      const now = new Date();
      const days = rangeDays;
      const buckets = Array.from({ length: days }).map((_, i) => {
        const d = new Date(now);
        d.setHours(0,0,0,0);
        d.setDate(now.getDate() - (days - 1 - i));
        return d;
      });

      // key by YYYY-MM-DD to latest entry (by createdAt)
      const latestByDay = new Map();
      items
        .slice() // don't mutate
        .sort((a,b) => {
          const aTs = a.createdAt ?? a.timestamp;
          const bTs = b.createdAt ?? b.timestamp;
          const da = aTs?.toDate?.() || new Date(aTs || 0);
          const db = bTs?.toDate?.() || new Date(bTs || 0);
          return db - da; // desc
        })
        .forEach((e) => {
          const ts = e.createdAt ?? e.timestamp;
          const d = (ts?.toDate?.() || new Date(ts || Date.now()));
          const key = localKey(d);
          if (!latestByDay.has(key)) {
            latestByDay.set(key, e);
          }
        });

      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const series = buckets.map((d) => {
        const key = localKey(d);
        const entry = latestByDay.get(key);
        if (!entry) return { name: dayNames[d.getDay()], mood: null, note: null, date: d };
        // Accept either `mood` (as in Journal.js) or `score`
        let scoreVal = undefined;
        if (typeof entry.mood === 'number') scoreVal = entry.mood;
        else if (typeof entry.score === 'number') scoreVal = entry.score;
        else if (entry.mood != null) scoreVal = Number(entry.mood);
        else if (entry.score != null) scoreVal = Number(entry.score);
        const score = Number.isFinite(scoreVal) ? scoreVal : null;
        // Tooltip note: prefer `note`, fallback to `content`
        const noteText = entry.note || entry.content || null;
        return {
          name: dayNames[d.getDay()],
          mood: score != null ? Number(Number(score).toFixed(1)) : null,
          note: noteText,
          date: d
        };
      });

      setMoodData(series);

      // Average of available (non-null) points in range
      const vals = series.map(p => p.mood).filter(v => v != null);
      setAvgMood(vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null);
    };
    computeMoodFromJournals(items);
  }, [userData?.uid, journalEntries, rangeDays]);

  useEffect(() => {
    if (!userData?.uid) return;
    const uid = userData.uid;
    const unsubChat = subscribeChatSessions(
      uid,
      (sessions) => {
        setChatCount(sessions.length);
        // update recent activity from sessions
        const recent = sessions.slice(0,5).map((s) => ({
          id: `chat-${s.id}`,
          type: 'chat',
          message: 'Completed a chat session with AI',
          time: (s.lastMessageAt?.toDate?.() || s.createdAt?.toDate?.() || new Date()).toLocaleString(),
          icon: MessageCircle,
          createdAt: s.lastMessageAt?.toDate?.() || s.createdAt?.toDate?.() || new Date()
        }));
        // merge with journal & resources later below
        setRecentActivity((prev) => {
          const others = prev.filter(p => !String(p.id).startsWith('chat-'));
          const combined = [...others, ...recent];
          combined.sort((a,b) => b.createdAt - a.createdAt);
          return combined.slice(0,10);
        });
      },
      (err) => {
        console.error('Chat sessions subscription error', err);
      }
    );

    const unsubResViewed = subscribeResourcesViewed(
      uid,
      (items) => {
        setResourcesCount(items.length);
        const recent = items.slice(0,5).map((r) => ({
          id: `res-${r.id}`,
          type: 'resource',
          message: `Viewed ${r.title || 'a resource'}`,
          time: (r.viewedAt?.toDate?.() || r.createdAt?.toDate?.() || new Date()).toLocaleString(),
          icon: BookOpen,
          createdAt: r.viewedAt?.toDate?.() || r.createdAt?.toDate?.() || new Date()
        }));
        setRecentActivity((prev) => {
          const others = prev.filter(p => !String(p.id).startsWith('res-'));
          const combined = [...others, ...recent];
          combined.sort((a,b) => b.createdAt - a.createdAt);
          return combined.slice(0,10);
        });
      },
      (err) => {
        console.error('Resources viewed subscription error', err);
      }
    );

    // Seed journal recent activity from context
    if (journalEntries && journalEntries.length) {
      const journalRecentLimit = 3; // configurable limit
      const recentJ = journalEntries
        .slice(0, journalRecentLimit)
        .map((j) => ({
          id: `journal-${j.id}`,
          type: 'journal',
          message: `Added a new journal entry ${moodEmoji(typeof j.mood === 'number' ? j.mood : (typeof j.score === 'number' ? j.score : Number(j.mood ?? j.score)))}` +
                   `${(typeof j.mood === 'number' || typeof j.score === 'number' || j.mood != null || j.score != null) ? ` (${Number((typeof j.mood === 'number' ? j.mood : (typeof j.score === 'number' ? j.score : Number(j.mood ?? j.score)))).toFixed(0)}/10)` : ''}`,
          time: (j.createdAt?.toDate?.() || new Date()).toLocaleString(),
          icon: FileText,
          createdAt: j.createdAt?.toDate?.() || new Date()
        }));
      setRecentActivity((prev) => {
        const others = prev.filter(p => !String(p.id).startsWith('journal-'));
        const combined = [...others, ...recentJ];
        combined.sort((a,b) => b.createdAt - a.createdAt);
        return combined.slice(0,10);
      });
    }

    return () => {
      unsubChat && unsubChat();
      unsubResViewed && unsubResViewed();
    };
  }, [userData?.uid, journalEntries]);

  // Helpers for chart styling
  const isToday = (date) => {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  // Color-coded dot for mood points and highlight today
  const renderMoodDot = (props) => {
    const { cx, cy, value, payload } = props;
    if (value == null) return null; // no dot for blanks
    let fill = '#3B82F6';
    if (value > 7) fill = '#10B981'; // green
    else if (value >= 4) fill = '#F59E0B'; // yellow
    else fill = '#EF4444'; // red
    if (payload?.date && isToday(new Date(payload.date))) {
      // Highlight today's mood
      fill = '#8B5CF6'; // purple
    }
    return (
      <circle cx={cx} cy={cy} r={6} stroke="#fff" strokeWidth={2} fill={fill} />
    );
  };

  // Label renderer to show score like "9/10"
  const renderMoodLabel = (props) => {
    const { x, y, value } = props;
    if (value == null) return null;
    return (
      <text x={x} y={y - 10} textAnchor="middle" fontSize={12} fill="#374151">{`${value}/10`}</text>
    );
  };

  // Custom tooltip to show score and note
  const renderMoodTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0]?.payload;
      if (p?.mood == null) return null;
      return (
        <div className="p-2 bg-white rounded border text-sm">
          <div className="font-medium">{label}</div>
          <div>Mood: {p.mood}</div>
          {p.note ? <div>Note: {p.note}</div> : null}
        </div>
      );
    }
    return null;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const moodEmoji = (score) => {
    if (score == null) return '🙂';
    if (score >= 7) return '😊';
    if (score >= 4) return '😐';
    return '😟';
  };

  // Compute dynamic stress distribution from journal entries in range
  const stressData = (() => {
    const vals = moodData.map(p => p.mood).filter(v => v != null);
    const total = vals.length || 1; // avoid divide by zero
    const low = vals.filter(v => v >= 7).length;
    const medium = vals.filter(v => v >= 4 && v <= 6).length;
    const high = vals.filter(v => v <= 3).length;
    return [
      { name: 'Low', value: Math.round((low/total)*100), color: '#10B981' },
      { name: 'Medium', value: Math.round((medium/total)*100), color: '#F59E0B' },
      { name: 'High', value: Math.round((high/total)*100), color: '#EF4444' }
    ];
  })();

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
                    <div className={`p-2 rounded-lg ${action.color} mr-3`} title={action.tooltip}>
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
            <div className="mt-4">
              <a href="/journal" className="btn-secondary">View Journal Insights</a>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mood Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mood Trends</h3>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1 text-sm rounded border ${rangeDays === 7 ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-700'}`}
                  onClick={() => setRangeDays(7)}
                >
                  Last 7 Days
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded border ${rangeDays === 30 ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-200 text-gray-700'}`}
                  onClick={() => setRangeDays(30)}
                >
                  Last 30 Days
                </button>
              </div>
            </div>
            {moodData.every(p => p.mood == null) ? (
              <div className="py-10 text-center text-gray-600">
                <div className="mb-3">
                  <Heart className="w-10 h-10 text-gray-300 inline" />
                </div>
                <div>No moods logged yet! Try adding your first journal entry.</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} allowDecimals={false} />
                  <Tooltip content={renderMoodTooltip} />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={renderMoodDot}
                    label={renderMoodLabel}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  {avgMood != null && (
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#9CA3AF"
                      strokeDasharray="4 4"
                      isAnimationActive={false}
                      dot={false}
                      connectNulls
                      data={moodData.map(p => ({ ...p, avg: Number(avgMood.toFixed(1)) }))}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stress Levels */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stress Level Distribution</h3>
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="60%" height={150}>
                <PieChart>
                  <Pie
                    data={stressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {stressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {stressData.map((level, index) => (
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
          {journalEntries?.length > journalRecentLimit && (
            <div className="mt-3 text-right">
              <a href="/journal" className="text-sm text-primary-700 hover:underline">View all in Journal</a>
            </div>
          )}
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
