import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeAppointments,
  subscribeAvailabilitySlots,
  toggleAvailabilityActive,
  upsertCounsellorNote,
  subscribeCounsellorNotes,
  upsertAvailabilitySlot
} from '../../firebase/firestore';
import { updateAppointmentStatus, rescheduleAppointment, getAppointmentInsights } from '../../firebase/firestore';
import { Calendar, Clock, Users, Star, Save, Plus, Mail, ArrowRight, Video, MapPin, ChevronDown, ChevronRight, Lock, User as UserIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';

const SectionTitle = ({ children }) => (
  <h2 className="text-xl font-semibold text-gray-900 mb-4">{children}</h2>
);

const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const isTodayISO = (iso) => {
  const today = new Date(); today.setHours(0,0,0,0);
  return iso === today.toISOString().split('T')[0];
};

const Dashboard = () => {
  const { user, userData } = useAuth();
  const counsellorId = user?.uid;

  // Overview + bookings
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Availability
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [newTime, setNewTime] = useState('');

  // Profile (removed from dashboard to avoid permissions; move to dedicated page later)

  // Collapsible state for bookings
  const [collapsedDates, setCollapsedDates] = useState(new Set());
  const [showAll, setShowAll] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState({}); // { [apptId]: true }
  const [rescheduleValues, setRescheduleValues] = useState({}); // { [apptId]: { date, time } }
  // Insights per appointment (lazy-loaded)
  const [insightsOpen, setInsightsOpen] = useState({}); // { [apptId]: true }
  const [insightsLoading, setInsightsLoading] = useState({}); // { [apptId]: boolean }
  const [insightsData, setInsightsData] = useState({}); // { [apptId]: { moodTrend, assessments } }
  const [insightsError, setInsightsError] = useState({}); // { [apptId]: string }
  const [insightsDays, setInsightsDays] = useState({}); // { [apptId]: number }
  // Full trend modal
  const [trendModal, setTrendModal] = useState({ open: false, apptId: null });

  // Load insights (component scope for reuse in modal and cards)
  const loadInsights = useCallback(async (apptId, days = 7) => {
    setInsightsLoading(prev=>({ ...prev, [apptId]: true }));
    setInsightsError(prev=>({ ...prev, [apptId]: null }));
    const res = await getAppointmentInsights(apptId, counsellorId, days);
    if (res.success) {
      setInsightsData(prev=>({ ...prev, [apptId]: res.data }));
      setInsightsDays(prev=>({ ...prev, [apptId]: days }));
    } else {
      setInsightsError(prev=>({ ...prev, [apptId]: res.error || 'Failed to load insights' }));
    }
    setInsightsLoading(prev=>({ ...prev, [apptId]: false }));
  }, [counsellorId]);

  // Small inline sparkline chart
  const Sparkline = ({ series }) => {
    const data = (series || []).map(p => (typeof p.avg === 'number' ? p.avg : null));
    const width = 200; const height = 40; const pad = 2;
    const vals = data.filter(v=>v!=null);
    if (!vals.length) return <div className="text-xs text-gray-500">No mood data</div>;
    const min = Math.min(...vals); const max = Math.max(...vals);
    const norm = v => {
      if (v==null) return null;
      const y = max === min ? 0.5 : (v - min) / (max - min);
      return height - pad - (height - 2*pad) * y;
    };
    const step = (width - 2*pad) / Math.max(1, data.length - 1);
    let d = '';
    data.forEach((v, i) => {
      const x = pad + i * step;
      const y = norm(v);
      if (y == null) return;
      d += (d ? ' L ' : 'M ') + x + ' ' + y;
    });
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block">
        <path d={d} fill="none" stroke="#3B82F6" strokeWidth="2" />
      </svg>
    );
  };

  // Large trend chart for modal
  const BigTrend = ({ series }) => {
    const data = (series || []).map(p => (typeof p.avg === 'number' ? p.avg : null));
    const W = 640, H = 220, P = 24; // padding for axes
    const vals = data.filter(v=>v!=null);
    if (!vals.length) return <div className="text-sm text-gray-500">No mood data for selected range.</div>;
    const min = Math.min(...vals), max = Math.max(...vals);
    const normX = (i) => P + i * ((W - 2*P) / Math.max(1, data.length - 1));
    const normY = (v) => {
      if (v==null) return null;
      const y = max === min ? 0.5 : (v - min) / (max - min);
      return H - P - (H - 2*P) * y;
    };
    let d = '';
    data.forEach((v, i) => {
      const x = normX(i), y = normY(v);
      if (y == null) return;
      d += (d ? ' L ' : 'M ') + x + ' ' + y;
    });
    const yTicks = 4;
    const ticks = Array.from({length: yTicks+1}, (_,k)=> min + (k*(max-min)/yTicks));
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="w-full h-auto">
        <line x1={P} y1={H-P} x2={W-P} y2={H-P} stroke="#e5e7eb" />
        <line x1={P} y1={P} x2={P} y2={H-P} stroke="#e5e7eb" />
        {ticks.map((tv, idx)=>{
          const y = normY(tv);
          return (
            <g key={idx}>
              <line x1={P-4} y1={y} x2={W-P} y2={y} stroke="#f3f4f6" />
              <text x={4} y={y+4} fontSize="10" fill="#6b7280">{Math.round(tv)}</text>
            </g>
          );
        })}
        <path d={d} fill="none" stroke="#3B82F6" strokeWidth="2.5" />
        {data.map((v,i)=>{
          const y = normY(v); if (y==null) return null;
          return <circle key={i} cx={normX(i)} cy={y} r={2.5} fill="#3B82F6" />
        })}
      </svg>
    );
  };

  // Subscribe to counsellor appointments (real-time)
  useEffect(() => {
    if (!counsellorId) return;
    const unsub = subscribeAppointments(
      { counsellorId },
      (items) => { setAppointments(items); setLoadingAppointments(false); setAppointmentsError(null); },
      (err) => { console.error(err); setAppointmentsError(err?.data?.error || err?.message || 'Failed to load appointments'); toast.error('Failed to load appointments'); setLoadingAppointments(false); },
      500
    );
    return () => unsub && unsub();
  }, [counsellorId, reloadKey]);

  // Subscribe to availability for selected date
  useEffect(() => {
    if (!counsellorId || !selectedDate) return;
    const unsub = subscribeAvailabilitySlots(
      counsellorId,
      selectedDate,
      (items) => setSlots(items),
      (err) => { console.error(err); toast.error('Failed to load availability'); }
    );
    return () => unsub && unsub();
  }, [counsellorId, selectedDate]);

  // Load profile removed

  // (Resources removed per requirements)

  // Derive upcoming and past from full set to avoid discrepancies
  const upcoming = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    // Exclude cancelled/completed from upcoming
    return (appointments || [])
      .filter(a => {
        const s = String(a.status||'').toLowerCase();
        const future = String(a.appointmentDate||'') >= todayISO;
        return future && !['cancelled','canceled','completed'].includes(s);
      })
      .sort((a,b)=> (a.appointmentDate + a.appointmentTime).localeCompare(b.appointmentDate + b.appointmentTime));
  }, [appointments]);
  const past = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    return (appointments || [])
      .filter(a => String(a.appointmentDate||'') < todayISO)
      .sort((a,b)=> (b.appointmentDate + b.appointmentTime).localeCompare(a.appointmentDate + a.appointmentTime));
  }, [appointments]);

  // Overview calculations
  const upcomingCount = upcoming.length;
  const nextSession = useMemo(() => {
    if (!upcoming.length) return null;
    return upcoming[0]; // earliest upcoming by date/time
  }, [upcoming]);
  const studentsThisWeek = useMemo(() => {
    const weekAgoISO = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; })();
    const ids = new Set();
    appointments.forEach(a => { if (a.appointmentDate >= weekAgoISO) ids.add(a.studentId); });
    return ids.size;
  }, [appointments]);

  // Sessions trend (last 14 days)
  const trend14 = useMemo(() => {
    const days = [];
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      days.push({ iso, label: d.toLocaleDateString('en-US', { weekday: 'short' }), count: 0 });
    }
    const map = new Map(days.map(x => [x.iso, x]));
    appointments.forEach(a => {
      const t = map.get(a.appointmentDate);
      if (t) t.count++;
    });
    return days;
  }, [appointments]);

  const todayISO = useMemo(() => { const t = new Date(); t.setHours(0,0,0,0); return t.toISOString().split('T')[0]; }, []);

  // (Suggestions removed per requirements)

  // Notes subscription per appointment (inline mini-editor)
  const [noteTexts, setNoteTexts] = useState({});
  useEffect(() => {
    const unsubs = appointments.map(a => subscribeCounsellorNotes(
      a.id,
      counsellorId,
      (note) => setNoteTexts(prev => ({ ...prev, [a.id]: note?.text || '' })),
      (err) => console.error(err)
    ));
    return () => unsubs.forEach(u => u && u());
  }, [appointments, counsellorId]);

  const saveNote = async (appointmentId) => {
    const text = noteTexts[appointmentId] || '';
    const res = await upsertCounsellorNote(appointmentId, counsellorId, { text });
    if (!res.success) toast.error('Failed to save note'); else toast.success('Note saved');
  };

  const toggleSlot = async (time, active) => {
    const res = await toggleAvailabilityActive(counsellorId, selectedDate, time, active);
    if (!res.success) toast.error('Failed to update slot');
  };

  const addSlot = async () => {
    if (!newTime) return; const ok = /^\d{2}:\d{2}$/.test(newTime);
    if (!ok) { toast.error('Time must be HH:mm'); return; }
    const res = await upsertAvailabilitySlot(counsellorId, selectedDate, newTime);
    if (res.success) { setNewTime(''); toast.success('Slot added'); } else { toast.error(res.error || 'Failed to add slot'); }
  };

  // saveProfile removed

  // Greeting and animated counters
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const useCountUp = (value, duration = 800) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      let raf; const start = performance.now();
      const animate = (t) => {
        const p = Math.min(1, (t - start) / duration);
        setDisplay(Math.floor(value * p));
        if (p < 1) raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(raf);
    }, [value, duration]);
    return display;
  };
  const upcomingAnim = useCountUp(upcomingCount);
  const studentsAnim = useCountUp(studentsThisWeek);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with greeting */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {userData?.displayName || 'Counsellor'} 👋</h1>
        <p className="text-gray-600">Here’s an overview of your sessions and availability.</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="#bookings" className="card hover:bg-primary-50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Go to</p>
              <p className="text-lg font-semibold text-gray-900">My Bookings</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary-600" />
          </div>
        </a>
        <a href="#availability" className="card hover:bg-primary-50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Manage</p>
              <p className="text-lg font-semibold text-gray-900">Availability</p>
            </div>
            <Clock className="w-5 h-5 text-primary-600" />
          </div>
        </a>
        {/* Resources quick-link removed */}
      </div>
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming Sessions</p>
              <p className="text-2xl font-bold text-gray-900 transition-all">{upcomingAnim}</p>
              <p className="text-xs text-gray-500">{nextSession ? `${nextSession.appointmentDate} ${nextSession.appointmentTime}` : '—'}</p>
            </div>
            <Calendar className="w-6 h-6 text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Students This Week</p>
              <p className="text-2xl font-bold text-gray-900 transition-all">{studentsAnim}</p>
            </div>
            <Users className="w-6 h-6 text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Feedback</p>
              <p className="text-2xl font-bold text-gray-900">N/A</p>
            </div>
            <Star className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Sessions Trend (last 14 days) */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessions (Last 14 Days)</h3>
        <div className="w-full">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-24">
            {(() => {
              const max = Math.max(1, ...trend14.map(d => d.count));
              const barW = 100 / trend14.length;
              return trend14.map((d, i) => {
                const h = (d.count / max) * 35; // leave 5 units padding top
                const x = i * barW;
                const y = 40 - h;
                return (
                  <g key={d.iso}>
                    <rect x={x + 1} y={y} width={barW - 2} height={h} fill="#3B82F6" opacity="0.8" />
                  </g>
                );
              });
            })()}
          </svg>
          <div className="mt-2 grid grid-cols-7 text-[10px] text-gray-500">
            {trend14.filter((_,i)=>i%2===0).map(d => (
              <div key={d.iso} className="text-center">{d.label}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Bookings / Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card" id="bookings">
            <SectionTitle>My Bookings</SectionTitle>
            {loadingAppointments ? (
              <div className="text-center py-8 text-gray-500">Loading appointments…</div>
            ) : appointmentsError ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-600 mb-2">{appointmentsError}</p>
                <button className="btn-secondary" onClick={()=>{ setLoadingAppointments(true); setAppointmentsError(null); setReloadKey(k=>k+1); }}>
                  Retry
                </button>
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No upcoming bookings.</div>
            ) : (
              (() => {
                // Group by date
                const groups = upcoming.reduce((acc, a) => {
                  (acc[a.appointmentDate] ||= []).push(a);
                  return acc;
                }, {});
                const orderedDates = Object.keys(groups).sort();
                // If not showing all, limit to next 5 across dates
                let remaining = 5;
                const limited = !showAll ? orderedDates.reduce((acc, d) => {
                  if (remaining <= 0) return acc;
                  const slice = groups[d].slice(0, Math.max(0, remaining));
                  if (slice.length) {
                    acc[d] = slice; remaining -= slice.length;
                  }
                  return acc;
                }, {}) : groups;

                const toggleDate = (d) => {
                  setCollapsedDates(prev => {
                    const next = new Set(prev);
                    if (next.has(d)) next.delete(d); else next.add(d);
                    return next;
                  });
                };

                const BigTrend = ({ series }) => {
                  const data = (series || []).map(p => (typeof p.avg === 'number' ? p.avg : null));
                  const W = 640, H = 220, P = 24; // padding for axes
                  const vals = data.filter(v=>v!=null);
                  if (!vals.length) return <div className="text-sm text-gray-500">No mood data for selected range.</div>;
                  const min = Math.min(...vals), max = Math.max(...vals);
                  const normX = (i) => P + i * ((W - 2*P) / Math.max(1, data.length - 1));
                  const normY = (v) => {
                    if (v==null) return null;
                    const y = max === min ? 0.5 : (v - min) / (max - min);
                    return H - P - (H - 2*P) * y;
                  };
                  let d = '';
                  data.forEach((v, i) => {
                    const x = normX(i), y = normY(v);
                    if (y == null) return;
                    d += (d ? ' L ' : 'M ') + x + ' ' + y;
                  });
                  const yTicks = 4;
                  const ticks = Array.from({length: yTicks+1}, (_,k)=> min + (k*(max-min)/yTicks));
                  return (
                    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="w-full h-auto">
                      {/* axes */}
                      <line x1={P} y1={H-P} x2={W-P} y2={H-P} stroke="#e5e7eb" />
                      <line x1={P} y1={P} x2={P} y2={H-P} stroke="#e5e7eb" />
                      {/* y ticks */}
                      {ticks.map((tv, idx)=>{
                        const y = normY(tv);
                        return (
                          <g key={idx}>
                            <line x1={P-4} y1={y} x2={W-P} y2={y} stroke="#f3f4f6" />
                            <text x={4} y={y+4} fontSize="10" fill="#6b7280">{Math.round(tv)}</text>
                          </g>
                        );
                      })}
                      {/* line */}
                      <path d={d} fill="none" stroke="#3B82F6" strokeWidth="2.5" />
                      {/* points */}
                      {data.map((v,i)=>{
                        const y = normY(v); if (y==null) return null;
                        return <circle key={i} cx={normX(i)} cy={y} r={2.5} fill="#3B82F6" />
                      })}
                    </svg>
                  );
                };

                const statusBadge = (status) => {
                  const s = String(status || 'pending').toLowerCase();
                  let cls = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  if (s === 'confirmed' || s === 'approved') cls = 'bg-green-100 text-green-800 border-green-200';
                  if (s === 'cancelled' || s === 'canceled') cls = 'bg-red-100 text-red-800 border-red-200';
                  return <span className={`text-xs px-2 py-1 rounded border capitalize ${cls}`}>{s}</span>;
                };

                const loadInsights = async (apptId, days = 7) => {
                  setInsightsLoading(prev=>({ ...prev, [apptId]: true }));
                  setInsightsError(prev=>({ ...prev, [apptId]: null }));
                  const res = await getAppointmentInsights(apptId, counsellorId, days);
                  if (res.success) {
                    setInsightsData(prev=>({ ...prev, [apptId]: res.data }));
                    setInsightsDays(prev=>({ ...prev, [apptId]: days }));
                  } else {
                    setInsightsError(prev=>({ ...prev, [apptId]: res.error || 'Failed to load insights' }));
                  }
                  setInsightsLoading(prev=>({ ...prev, [apptId]: false }));
                };

                const Sparkline = ({ series }) => {
                  // series: [{date, avg}] up to ~31 points
                  const data = (series || []).map(p => (typeof p.avg === 'number' ? p.avg : null));
                  const width = 200; const height = 40; const pad = 2;
                  const vals = data.filter(v=>v!=null);
                  if (!vals.length) return <div className="text-xs text-gray-500">No mood data</div>;
                  const min = Math.min(...vals); const max = Math.max(...vals);
                  const norm = v => {
                    if (v==null) return null;
                    const y = max === min ? 0.5 : (v - min) / (max - min);
                    return height - pad - (height - 2*pad) * y;
                  };
                  const step = (width - 2*pad) / Math.max(1, data.length - 1);
                  let d = '';
                  data.forEach((v, i) => {
                    const x = pad + i * step;
                    const y = norm(v);
                    if (y == null) return;
                    d += (d ? ' L ' : 'M ') + x + ' ' + y;
                  });
                  return (
                    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block">
                      <path d={d} fill="none" stroke="#3B82F6" strokeWidth="2" />
                    </svg>
                  );
                };

                const renderCard = (a) => (
                  <div key={a.id} className={`p-4 rounded-xl shadow-sm border ${isTodayISO(a.appointmentDate) ? 'bg-primary-50/50 border-primary-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                          <span>{a.studentName || a.studentId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{formatDate(a.appointmentDate)} • {a.appointmentTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          {a.sessionType === 'in-person' ? <MapPin className="w-4 h-4 text-gray-500" /> : <Video className="w-4 h-4 text-gray-500" />}
                          <span className="capitalize">{a.sessionType || 'session'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {a.studentEmail && (
                          <a href={`mailto:${a.studentEmail}`} className="inline-flex items-center text-xs text-primary-600 hover:underline">
                            <Mail className="w-3 h-3 mr-1"/> Email
                          </a>
                        )}
                        {statusBadge(a.status)}
                      </div>
                    </div>
                    {/* Actions: Confirm / Cancel / Reschedule */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        className="px-2 py-1 text-xs rounded border border-green-300 text-green-700 hover:bg-green-50"
                        onClick={async ()=>{
                          const r = await updateAppointmentStatus(a.id, 'approved', counsellorId);
                          if (!r.success) toast.error(r.error||'Failed to confirm'); else toast.success('Appointment confirmed');
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        className="px-2 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50"
                        onClick={async ()=>{
                          const r = await updateAppointmentStatus(a.id, 'cancelled', counsellorId);
                          if (!r.success) toast.error(r.error||'Failed to cancel'); else toast.success('Appointment cancelled');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-2 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={()=> setRescheduleOpen(o=>({ ...o, [a.id]: !o[a.id] }))}
                      >
                        {rescheduleOpen[a.id] ? 'Close Reschedule' : 'Reschedule'}
                      </button>
                    </div>
                    {/* Insights toggle */}
                    <div className="mt-3">
                      <button
                        className="text-xs text-primary-700 hover:underline"
                        onClick={async ()=>{
                          setInsightsOpen(o=>({ ...o, [a.id]: !o[a.id] }));
                          const alreadyLoaded = !!insightsData[a.id];
                          if (!insightsOpen[a.id] && !alreadyLoaded) {
                            await loadInsights(a.id, 7);
                          }
                        }}
                      >
                        {insightsOpen[a.id] ? 'Hide' : 'Show'} mood & assessment
                      </button>
                      {insightsOpen[a.id] && (
                        <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                          {/* Range toggle */}
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-[11px] text-gray-600">Range:</span>
                            {[7,30].map(d => (
                              <button
                                key={d}
                                className={`text-[11px] px-2 py-0.5 rounded border ${ (insightsDays[a.id]||7)===d ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
                                onClick={()=> loadInsights(a.id, d)}
                                disabled={insightsLoading[a.id]}
                              >
                                {d}d
                              </button>
                            ))}
                          </div>
                          {insightsLoading[a.id] ? (
                            <div className="text-xs text-gray-500">Loading insights…</div>
                          ) : insightsError[a.id] ? (
                            <div className="text-xs text-red-600">{insightsError[a.id]}</div>
                          ) : insightsData[a.id] ? (
                            <div className="space-y-2">
                              <div>
                                <div className="text-xs font-medium text-gray-700 mb-1">Mood (last {(insightsDays[a.id]||7)} days)</div>
                                <div className="flex items-center justify-between">
                                  <Sparkline series={insightsData[a.id].moodTrend} />
                                  <button className="text-[11px] text-primary-700 hover:underline ml-2" onClick={()=> setTrendModal({ open: true, apptId: a.id })}>View full trend</button>
                                </div>
                                {(!insightsData[a.id].moodTrend || insightsData[a.id].moodTrend.every(p=>p.avg==null)) && (
                                  <div className="text-[11px] text-gray-500 mt-1">No mood recorded in last {(insightsDays[a.id]||7)} days. Try 30d.</div>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="p-2 bg-white border rounded">
                                  <div className="text-xs text-gray-500">PHQ-9</div>
                                  <div className="font-medium">{insightsData[a.id].assessments?.phq9?.score ?? '—'}</div>
                                  <div className="text-xs text-gray-500">{insightsData[a.id].assessments?.phq9?.severity || ''}</div>
                                </div>
                                <div className="p-2 bg-white border rounded">
                                  <div className="text-xs text-gray-500">GAD-7</div>
                                  <div className="font-medium">{insightsData[a.id].assessments?.gad7?.score ?? '—'}</div>
                                  <div className="text-xs text-gray-500">{insightsData[a.id].assessments?.gad7?.severity || ''}</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">No insights available.</div>
                          )}
                        </div>
                      )}
                    </div>
                    {rescheduleOpen[a.id] && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">New Date</label>
                          <input
                            type="date"
                            className="input-field"
                            value={rescheduleValues[a.id]?.date || ''}
                            onChange={(e)=> setRescheduleValues(v=>({ ...v, [a.id]: { ...(v[a.id]||{}), date: e.target.value } }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">New Time (HH:mm)</label>
                          <input
                            type="text"
                            placeholder="09:30"
                            className="input-field"
                            value={rescheduleValues[a.id]?.time || ''}
                            onChange={(e)=> setRescheduleValues(v=>({ ...v, [a.id]: { ...(v[a.id]||{}), time: e.target.value } }))}
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            className="btn-primary text-xs w-full"
                            onClick={async ()=>{
                              const val = rescheduleValues[a.id]||{};
                              if (!val.date || !val.time) { toast.error('Select date and time'); return; }
                              const r = await rescheduleAppointment(a.id, { appointmentDate: val.date, appointmentTime: val.time }, counsellorId);
                              if (!r.success) toast.error(r.error||'Failed to reschedule'); else { toast.success('Rescheduled'); setRescheduleOpen(o=>({ ...o, [a.id]: false })); }
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Private Notes */}
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1 inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-gray-500"/> Private Notes
                      </label>
                      <textarea
                        rows={3}
                        value={noteTexts[a.id] ?? ''}
                        onChange={(e)=>setNoteTexts(prev=>({ ...prev, [a.id]: e.target.value }))}
                        className="input-field"
                        placeholder="Notes only you can see"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={()=>saveNote(a.id)} className="btn-primary inline-flex items-center text-sm"><Save className="w-4 h-4 mr-1"/>Save</button>
                      </div>
                    </div>
                  </div>
                );

                return (
                  <div className="space-y-4">
                    {Object.keys(limited).map(d => (
                      <div key={d} className="border rounded-lg">
                        <button type="button" onClick={()=>toggleDate(d)} className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-t-lg">
                          <div className="font-medium text-gray-900">📅 {new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          {collapsedDates.has(d) ? <ChevronRight className="w-4 h-4 text-gray-500"/> : <ChevronDown className="w-4 h-4 text-gray-500"/>}
                        </button>
                        {!collapsedDates.has(d) && (
                          <div className="p-3 space-y-3">
                            {limited[d].map(renderCard)}
                          </div>
                        )}
                      </div>
                    ))}
                    {Object.keys(groups).length > Object.keys(limited).length && (
                      <div className="text-center">
                        <button className="btn-secondary" onClick={()=>setShowAll(true)}>View All</button>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>

          {/* Resources section removed */}
        </div>

        {/* Availability (Profile moved out of dashboard) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Availability */}
          <div className="card" id="availability">
            <SectionTitle>Availability</SectionTitle>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Slot (HH:mm)</label>
                <div className="flex items-center gap-2">
                  <input type="text" value={newTime} onChange={(e)=>setNewTime(e.target.value)} placeholder="09:30" className="input-field flex-1" />
                  <button onClick={addSlot} className="btn-primary inline-flex items-center"><Plus className="w-4 h-4 mr-1"/>Add</button>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-auto pr-1">
                {slots.map(s => (
                  <div key={s.id || s.time} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{s.time}</p>
                      <p className={`text-xs ${s.booked ? 'text-red-600' : 'text-green-600'}`}>{s.booked ? 'Booked' : 'Available'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">Active</label>
                      <input type="checkbox" checked={!!s.active} onChange={(e)=>toggleSlot(s.time, e.target.checked)} />
                    </div>
                  </div>
                ))}
                {slots.length === 0 && (
                  <div className="text-xs text-gray-500">No slots for this date. Add one above.</div>
                )}
              </div>
            </div>
          </div>

          {/* Profile settings removed from dashboard; move to separate Profile page later */}
        </div>
      </div>

      {/* Full Trend Modal */}
      {trendModal.open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setTrendModal({ open:false, apptId:null })} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Mood Trend</h3>
                <button className="p-1 hover:bg-gray-100 rounded" onClick={()=>setTrendModal({ open:false, apptId:null })}><X className="w-5 h-5 text-gray-600"/></button>
              </div>
              {trendModal.apptId && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Range:</span>
                    {[7,30].map(d => (
                      <button
                        key={d}
                        className={`text-xs px-2 py-1 rounded border ${ (insightsDays[trendModal.apptId]||7)===d ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
                        onClick={async ()=>{ await loadInsights(trendModal.apptId, d); }}
                      >{d}d</button>
                    ))}
                  </div>
                  {insightsLoading[trendModal.apptId] ? (
                    <div className="text-sm text-gray-500">Loading…</div>
                  ) : insightsError[trendModal.apptId] ? (
                    <div className="text-sm text-red-600">{insightsError[trendModal.apptId]}</div>
                  ) : insightsData[trendModal.apptId] ? (
                    <BigTrend series={insightsData[trendModal.apptId].moodTrend} />
                  ) : (
                    <div className="text-sm text-gray-500">No data.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
