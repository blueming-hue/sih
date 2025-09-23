import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeAppointments, subscribeNotifications, updateAppointmentStatus, rescheduleAppointment, createChatSession, completeAppointment, startAppointment } from '../../firebase/firestore';
import { Calendar, Clock, CheckCircle, XCircle, Edit2, Save, X, ChevronLeft, ChevronRight, Mail, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const formatDateLong = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const formatDateShort = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const Bookings = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [editing, setEditing] = useState(null); // appointmentId
  const [editDraft, setEditDraft] = useState({ appointmentDate: '', appointmentTime: '' });

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

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeAppointments({ counsellorId: user.uid }, (items) => {
      setAppointments(items);
      setLoading(false);
    }, (err)=>{ console.error(err); toast.error('Failed to load appointments'); setLoading(false); }, 500);
    return () => unsub && unsub();
  }, [user]);

  // Realtime notifications toasts
  useEffect(() => {
    if (!user) return;
    let seen = new Set();
    const unsub = subscribeNotifications(user.uid, (items)=>{
      items.slice(0, 5).forEach(n => {
        if (seen.has(n.id)) return;
        seen.add(n.id);
        const t = String(n.type||'');
        if (t === 'appointment_status') {
          toast.success(n.title || 'Appointment update');
        } else if (t === 'appointment_deleted') {
          toast('Appointment cancelled and removed', { icon: '🗑️' });
        } else if (t === 'appointment_completed') {
          toast('Student prompted for feedback', { icon: '⭐' });
        }
      });
    }, (err)=>console.error(err));
    return () => unsub && unsub();
  }, [user]);

  const upcoming = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.appointmentDate >= todayISO).sort((a,b)=>(a.appointmentDate + a.appointmentTime).localeCompare(b.appointmentDate + b.appointmentTime));
  }, [appointments]);
  const past = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.appointmentDate < todayISO).sort((a,b)=>(b.appointmentDate + b.appointmentTime).localeCompare(a.appointmentDate + a.appointmentTime));
  }, [appointments]);

  const upcomingAnim = useCountUp(upcoming.length);
  const pastAnim = useCountUp(past.length);

  // Weekly/monthly trend counts
  const weekTrend = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const labels = []; const counts = [];
    for (let i=6;i>=0;i--){
      const d = new Date(today); d.setDate(today.getDate()-i);
      const iso = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('en-US',{weekday:'short'}));
      counts.push(appointments.filter(a=>a.appointmentDate===iso).length);
    }
    return { labels, counts };
  }, [appointments]);

  const startSession = async (apt) => {
    try {
      // Mark in progress in backend
      await startAppointment(apt.id, user.uid);
      const res = await createChatSession({
        userId: user.uid,
        participantId: apt.studentId,
        participantName: apt.studentName || null,
        context: 'counselling',
      });
      if (res.success) {
        // Launch based on session type
        const sType = String(apt.sessionType||'').toLowerCase();
        if (sType === 'video' || sType === 'video call') {
          toast.success('Starting video call…');
          // TODO: integrate your video provider route/page
        } else if (sType === 'audio' || sType === 'audio call') {
          toast.success('Starting audio call…');
        } else {
          toast('In-person session — check location details', { icon: '📍' });
        }
      } else {
        toast.error(res.error || 'Failed to start session');
      }
    } catch (e) {
      toast.error('Failed to start session');
    }
  };

  const monthDays = useMemo(() => {
    const first = new Date(selectedMonth);
    const year = first.getFullYear();
    const month = first.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const iso = d.toISOString().split('T')[0];
      const count = appointments.filter(a => a.appointmentDate === iso).length;
      days.push({ iso, day: i, count });
    }
    return days;
  }, [selectedMonth, appointments]);

  const changeMonth = (delta) => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const doConfirm = async (id) => {
    const res = await updateAppointmentStatus(id, 'confirmed', user?.uid);
    if (!res.success) toast.error(res.error || 'Failed to confirm'); else toast.success('Appointment confirmed');
  };
  const doCancel = async (id) => {
    const res = await updateAppointmentStatus(id, 'cancelled', user?.uid);
    if (!res.success) toast.error(res.error || 'Failed to cancel'); else toast.success('Appointment cancelled');
  };
  const startEdit = (apt) => {
    setEditing(apt.id);
    setEditDraft({ appointmentDate: apt.appointmentDate, appointmentTime: apt.appointmentTime });
  };
  const saveEdit = async () => {
    const { appointmentDate, appointmentTime } = editDraft;
    if (!appointmentDate || !/^\d{2}:\d{2}$/.test(appointmentTime)) { toast.error('Provide date and HH:mm'); return; }
    const res = await rescheduleAppointment(editing, { appointmentDate, appointmentTime }, user?.uid);
    if (!res.success) toast.error(res.error || 'Failed to reschedule'); else toast.success('Rescheduled');
    setEditing(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Greeting and stats */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{greeting}, here are your bookings</h1>
          <p className="text-gray-600">Upcoming and past sessions, trends, and quick actions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>changeMonth(-1)} className="btn-secondary"><ChevronLeft className="w-4 h-4"/></button>
          <div className="px-3 py-2 text-sm border rounded">{selectedMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</div>
          <button onClick={()=>changeMonth(1)} className="btn-secondary"><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Animated stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingAnim}</p>
            </div>
            <Calendar className="w-6 h-6 text-primary-600"/>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Past Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{pastAnim}</p>
            </div>
            <Clock className="w-6 h-6 text-primary-600"/>
          </div>
        </div>
      </div>

      {/* Weekly trend chart */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Weekly Sessions</h2>
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-20">
          {(() => {
            const max = Math.max(1, ...weekTrend.counts);
            const barW = 100 / weekTrend.counts.length;
            return weekTrend.counts.map((c, i) => {
              const h = (c / max) * 35; const x = i * barW; const y = 40 - h;
              return <rect key={i} x={x + 1} y={y} width={barW - 2} height={h} fill="#10B981" opacity="0.9"/>;
            });
          })()}
        </svg>
        <div className="mt-1 grid grid-cols-7 text-[10px] text-gray-500">
          {weekTrend.labels.map((l, i)=>(<div key={i} className="text-center">{l}</div>))}
        </div>
      </div>

      {/* Calendar mini-view */}
      <div className="grid grid-cols-7 gap-2 mb-8">
        {monthDays.map(d => (
          <div key={d.iso} className={`p-3 border rounded ${d.count>0?'bg-primary-50 border-primary-200':'border-gray-200'}`}>
            <div className="text-xs text-gray-500">{formatDateShort(d.iso)}</div>
            <div className="text-sm font-medium text-gray-900">{d.count} sessions</div>
          </div>
        ))}
      </div>

      {/* Upcoming */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h2>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : upcoming.length === 0 ? (
          <div className="text-sm text-gray-500">No upcoming bookings.</div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(a => (
              <div key={a.id} className="p-4 border rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{a.studentName || a.studentId}</p>
                    <p className="text-sm text-gray-600">{formatDateLong(a.appointmentDate)} • {a.appointmentTime}</p>
                    <p className="text-xs text-gray-500">Status: <span className="capitalize">{a.status}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.studentEmail && (
                      <a href={`mailto:${a.studentEmail}`} className="inline-flex items-center text-sm text-primary-600 hover:underline"><Mail className="w-4 h-4 mr-1"/>Email</a>
                    )}
                    <button onClick={()=>startSession(a)} className="inline-flex items-center text-sm px-3 py-2 border rounded text-primary-700 bg-primary-50 border-primary-200"><MessageCircle className="w-4 h-4 mr-1"/>Start Session</button>
                    {a.status === 'pending' && <button onClick={()=>doConfirm(a.id)} className="btn-primary inline-flex items-center text-sm"><CheckCircle className="w-4 h-4 mr-1"/>Confirm</button>}
                    {(['approved','confirmed'].includes(String(a.status||'').toLowerCase())) && (
                      <button
                        onClick={async ()=>{
                          const ok = window.confirm('Mark this session as completed? The student will be prompted to leave feedback.');
                          if (!ok) return;
                          const r = await completeAppointment(a.id, user?.uid);
                          if (!r.success) toast.error(r.error||'Failed to mark completed'); else toast.success('Marked completed');
                        }}
                        className="inline-flex items-center text-sm px-3 py-2 border rounded text-emerald-700 bg-emerald-50 border-emerald-200"
                      >
                        <CheckCircle className="w-4 h-4 mr-1"/>Mark Completed
                      </button>
                    )}
                    <button onClick={()=>startEdit(a)} className="btn-secondary inline-flex items-center text-sm"><Edit2 className="w-4 h-4 mr-1"/>Reschedule</button>
                    <button onClick={()=>doCancel(a.id)} className="inline-flex items-center text-sm px-3 py-2 border rounded text-red-700 bg-red-50 border-red-200"><XCircle className="w-4 h-4 mr-1"/>Cancel</button>
                  </div>
                </div>
                {editing === a.id && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input type="date" className="input-field" value={editDraft.appointmentDate} onChange={(e)=>setEditDraft(d=>({...d, appointmentDate: e.target.value}))} />
                    <input type="text" className="input-field" placeholder="HH:mm" value={editDraft.appointmentTime} onChange={(e)=>setEditDraft(d=>({...d, appointmentTime: e.target.value}))} />
                    <div className="flex items-center gap-2">
                      <button onClick={saveEdit} className="btn-primary inline-flex items-center text-sm"><Save className="w-4 h-4 mr-1"/>Save</button>
                      <button onClick={()=>setEditing(null)} className="btn-secondary inline-flex items-center text-sm"><X className="w-4 h-4 mr-1"/>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Past</h2>
        {past.length === 0 ? (
          <div className="text-sm text-gray-500">No past bookings.</div>
        ) : (
          <div className="space-y-2">
            {past.map(a => (
              <div key={a.id} className="p-3 border rounded bg-gray-50">
                <p className="font-medium text-gray-900">{a.studentName || a.studentId}</p>
                <p className="text-sm text-gray-600">{formatDateLong(a.appointmentDate)} • {a.appointmentTime} • <span className="capitalize">{a.status}</span></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
