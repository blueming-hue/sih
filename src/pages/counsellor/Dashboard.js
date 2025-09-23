import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeCounsellorAppointments,
  subscribeAvailabilitySlots,
  toggleAvailabilityActive,
  upsertCounsellorNote,
  subscribeCounsellorNotes,
  subscribeCounsellorProfile,
  updateCounsellorProfile,
  getCounsellorResources,
  getResources,
  upsertAvailabilitySlot
} from '../../firebase/firestore';
import { Calendar, Clock, Users, Star, BookOpen, CheckCircle, AlertCircle, Edit2, Save, X, Plus, Mail, ArrowRight } from 'lucide-react';
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

  // Availability
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [newTime, setNewTime] = useState('');

  // Profile
  const [profile, setProfile] = useState(null);
  const [editProfile, setEditProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ specialization: '', experience: '', bio: '', phone: '' });

  // Resources
  const [resources, setResources] = useState([]);
  const [suggested, setSuggested] = useState([]);

  // Subscribe to upcoming appointments
  useEffect(() => {
    if (!counsellorId) return;
    const unsub = subscribeCounsellorAppointments(
      counsellorId,
      (items) => { setAppointments(items); setLoadingAppointments(false); },
      (err) => { console.error(err); toast.error('Failed to load appointments'); setLoadingAppointments(false); }
    );
    return () => unsub && unsub();
  }, [counsellorId]);

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

  // Load profile
  useEffect(() => {
    if (!counsellorId) return;
    const unsub = subscribeCounsellorProfile(
      counsellorId,
      (doc) => {
        setProfile(doc);
        if (doc) {
          setProfileDraft({
            specialization: doc.specialization || '',
            experience: doc.experience || '',
            bio: doc.bio || '',
            phone: doc.phone || ''
          });
        }
      },
      (err) => console.error(err)
    );
    return () => unsub && unsub();
  }, [counsellorId]);

  // Load resources once
  useEffect(() => {
    (async () => {
      const res = await getCounsellorResources();
      if (res.success) setResources(res.data);
    })();
  }, []);

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

  // Smart resource suggestions based on today's appointment reasons
  useEffect(() => {
    const load = async () => {
      try {
        const reasons = Array.from(new Set(todaysAppointments.map(a => a.reason).filter(Boolean)));
        if (reasons.length === 0) { setSuggested([]); return; }
        // Map reasons -> categories in RESOURCES
        const mapReasonToCategory = (r) => {
          switch (r) {
            case 'anxiety': return 'Anxiety & Stress';
            case 'depression': return 'Depression & Mood';
            case 'academic': return 'Academic Stress';
            case 'relationships': return 'Relationship Issues';
            case 'career': return 'Career Guidance';
            default: return null;
          }
        };
        const cats = Array.from(new Set(reasons.map(mapReasonToCategory).filter(Boolean)));
        const results = await Promise.all(cats.map(c => getResources(c)));
        const merged = new Map();
        results.forEach(res => {
          if (res?.success) {
            res.data.forEach(item => {
              if (!merged.has(item.id)) merged.set(item.id, item);
            });
          }
        });
        setSuggested(Array.from(merged.values()).slice(0, 6));
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [todaysAppointments]);

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

  const saveProfile = async () => {
    const res = await updateCounsellorProfile(counsellorId, profileDraft);
    if (res.success) { toast.success('Profile updated'); setEditProfile(false); } else { toast.error(res.error || 'Failed to update profile'); }
  };

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
        <p className="text-gray-600">Here’s an overview of your sessions and resources.</p>
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
        <a href="#resources" className="card hover:bg-primary-50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Browse</p>
              <p className="text-lg font-semibold text-gray-900">Resources</p>
            </div>
            <BookOpen className="w-5 h-5 text-primary-600" />
          </div>
        </a>
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
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No upcoming bookings.</div>
            ) : (
              <div className="space-y-3">
                {appointments.map(a => (
                  <div key={a.id} className={`p-4 border rounded-lg ${isTodayISO(a.appointmentDate) ? 'border-primary-300 bg-primary-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{a.studentName || a.studentId}</p>
                        <p className="text-sm text-gray-600">{formatDate(a.appointmentDate)} • {a.appointmentTime} • <span className="text-gray-500">{a.sessionType}</span></p>
                        <p className="text-xs text-gray-500">Session ID: {a.id}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {a.studentEmail && (
                          <a href={`mailto:${a.studentEmail}`} className="inline-flex items-center text-xs text-primary-600 hover:underline">
                            <Mail className="w-3 h-3 mr-1"/> Email
                          </a>
                        )}
                        <div className="text-xs text-gray-500 capitalize">{a.status}</div>
                      </div>
                    </div>

                    {/* Private Notes */}
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Private Notes</label>
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
                ))}
              </div>
            )}
          </div>

          {/* Resources */}
          <div className="card" id="resources">
            <SectionTitle>Resources</SectionTitle>
            {suggested.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-900">Suggested for Today's Students</p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggested.map(r => (
                    <a key={`sugg-${r.id}`} href={r.url} target="_blank" rel="noreferrer" className="p-3 border rounded hover:bg-gray-50">
                      <p className="font-medium text-gray-900">{r.title}</p>
                      <p className="text-xs text-gray-600">{r.description || ''}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {resources.length === 0 ? (
              <div className="text-sm text-gray-500">No resources yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map(r => (
                  <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="p-4 border rounded hover:bg-gray-50">
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-sm text-gray-600">{r.description || ''}</p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Availability + Profile */}
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

          {/* Profile Settings */}
          <div className="card" id="profile">
            <SectionTitle>Profile Settings</SectionTitle>
            {!profile ? (
              <div className="text-sm text-gray-500">Loading profile…</div>
            ) : (
              <div className="space-y-3">
                {!editProfile ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{profile.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Specialization</p>
                      <p className="font-medium text-gray-900">{profile.specialization || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="font-medium text-gray-900">{profile.experience || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bio</p>
                      <p className="font-medium text-gray-900 whitespace-pre-wrap">{profile.bio || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{profile.phone || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={()=>setEditProfile(true)} className="btn-secondary inline-flex items-center text-sm"><Edit2 className="w-4 h-4 mr-1"/>Edit</button>
                      <span className={`text-xs ${profile.active ? 'text-green-600' : 'text-yellow-700'}`}>{profile.active ? 'Active' : 'Pending Approval'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Specialization</label>
                      <input value={profileDraft.specialization} onChange={(e)=>setProfileDraft(d=>({...d, specialization: e.target.value}))} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Experience</label>
                      <input value={profileDraft.experience} onChange={(e)=>setProfileDraft(d=>({...d, experience: e.target.value}))} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Bio</label>
                      <textarea rows={3} value={profileDraft.bio} onChange={(e)=>setProfileDraft(d=>({...d, bio: e.target.value}))} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Phone</label>
                      <input value={profileDraft.phone} onChange={(e)=>setProfileDraft(d=>({...d, phone: e.target.value}))} className="input-field" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={saveProfile} className="btn-primary inline-flex items-center text-sm"><Save className="w-4 h-4 mr-1"/>Save</button>
                      <button onClick={()=>{ setEditProfile(false); setProfileDraft({ specialization: profile.specialization||'', experience: profile.experience||'', bio: profile.bio||'', phone: profile.phone||'' }); }} className="btn-secondary inline-flex items-center text-sm"><X className="w-4 h-4 mr-1"/>Cancel</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
