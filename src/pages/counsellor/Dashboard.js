import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeCounsellorAppointments,
  subscribeAvailabilitySlots,
  toggleAvailabilityActive,
  upsertCounsellorNote,
  subscribeCounsellorNotes,
  upsertAvailabilitySlot
} from '../../firebase/firestore';
import { updateAppointmentStatus, rescheduleAppointment } from '../../firebase/firestore';
import { Calendar, Clock, Users, Star, Save, Plus, Mail, ArrowRight, Video, MapPin, ChevronDown, ChevronRight, Lock, User as UserIcon } from 'lucide-react';
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

  // Subscribe to upcoming appointments
  useEffect(() => {
    if (!counsellorId) return;
    const unsub = subscribeCounsellorAppointments(
      counsellorId,
      (items) => { setAppointments(items); setLoadingAppointments(false); setAppointmentsError(null); },
      (err) => { console.error(err); setAppointmentsError(err?.data?.error || err?.message || 'Failed to load appointments'); toast.error('Failed to load appointments'); setLoadingAppointments(false); }
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

  // Overview calculations
  const upcomingCount = appointments.length;
  const nextSession = useMemo(() => {
    if (!appointments.length) return null;
    return appointments[0]; // earliest by date asc
  }, [appointments]);
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
  const todaysAppointments = useMemo(() => appointments.filter(a => a.appointmentDate === todayISO), [appointments, todayISO]);

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
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No upcoming bookings.</div>
            ) : (
              (() => {
                // Group by date
                const groups = appointments.reduce((acc, a) => {
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

                const statusBadge = (status) => {
                  const s = String(status || 'pending').toLowerCase();
                  let cls = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  if (s === 'confirmed' || s === 'approved') cls = 'bg-green-100 text-green-800 border-green-200';
                  if (s === 'cancelled' || s === 'canceled') cls = 'bg-red-100 text-red-800 border-red-200';
                  return <span className={`text-xs px-2 py-1 rounded border capitalize ${cls}`}>{s}</span>;
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
    </div>
  );
};

export default Dashboard;
