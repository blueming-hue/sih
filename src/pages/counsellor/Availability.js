import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeAvailabilitySlots,
  upsertAvailabilitySlot,
  toggleAvailabilityActive,
  deleteAvailabilitySlot
} from '../../firebase/firestore';
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const startOfWeekISO = (d = new Date()) => {
  const day = new Date(d);
  const diff = day.getDate() - day.getDay(); // Sun start
  const start = new Date(day.setDate(diff));
  start.setHours(0,0,0,0);
  return start.toISOString().split('T')[0];
};

const addDaysISO = (iso, n) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

const Availability = () => {
  const { user } = useAuth();
  const counsellorId = user?.uid;

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [newTime, setNewTime] = useState('');

  // Heatmap week range
  const [weekStart, setWeekStart] = useState(() => startOfWeekISO());
  const weekDays = useMemo(() => Array.from({length:7}, (_,i)=> addDaysISO(weekStart, i)), [weekStart]);
  const [weekCounts, setWeekCounts] = useState({}); // { iso: { total, booked } }

  // Subscribe to selected date slots
  useEffect(() => {
    if (!counsellorId || !selectedDate) return;
    const unsub = subscribeAvailabilitySlots(counsellorId, selectedDate, (items) => setSlots(items), (e)=>{ console.error(e); toast.error('Failed to load slots'); });
    return () => unsub && unsub();
  }, [counsellorId, selectedDate]);

  // Load weekly counts by briefly subscribing each day once
  useEffect(() => {
    if (!counsellorId) return;
    const unsubs = weekDays.map(iso => subscribeAvailabilitySlots(
      counsellorId, iso,
      (items) => setWeekCounts(prev => ({ ...prev, [iso]: { total: items.length, booked: items.filter(s=>s.booked).length } })),
      (e)=>console.error(e)
    ));
    return () => unsubs.forEach(u=>u&&u());
  }, [counsellorId, weekDays.join(',')]);

  const addSlot = async () => {
    if (!/^\d{2}:\d{2}$/.test(newTime)) { toast.error('Time must be HH:mm'); return; }
    const res = await upsertAvailabilitySlot(counsellorId, selectedDate, newTime);
    if (res.success) { setNewTime(''); toast.success('Slot added'); } else { toast.error(res.error || 'Failed to add'); }
  };

  const toggleActive = async (time, active) => {
    const res = await toggleAvailabilityActive(counsellorId, selectedDate, time, active);
    if (!res.success) toast.error(res.error || 'Failed to update');
  };

  const removeSlot = async (time) => {
    const res = await deleteAvailabilitySlot(counsellorId, selectedDate, time);
    if (!res.success) toast.error(res.error || 'Failed to delete'); else toast.success('Slot cleared');
  };

  const changeWeek = (delta) => {
    const newStart = addDaysISO(weekStart, delta * 7);
    setWeekStart(newStart);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
        <p className="text-gray-600">Manage your weekly availability and maintain active slots.</p>
      </div>

      {/* Weekly heatmap */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Weekly Heatmap</h2>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={()=>changeWeek(-1)}>Prev</button>
            <button className="btn-secondary" onClick={()=>changeWeek(1)}>Next</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(iso => {
            const stat = weekCounts[iso] || { total: 0, booked: 0 };
            const ratio = stat.total === 0 ? 0 : stat.booked / stat.total;
            const bg = ratio === 0 ? 'bg-green-50' : ratio < 0.5 ? 'bg-yellow-50' : 'bg-red-50';
            return (
              <div key={iso} className={`p-3 border rounded ${bg}`}>
                <div className="text-xs text-gray-500">{new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div className="text-sm text-gray-900">{stat.total} slots</div>
                <div className="text-xs text-gray-600">{stat.booked} booked</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manage selected date */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <input type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Slot (HH:mm)</label>
            <div className="flex items-center gap-2">
              <input type="text" value={newTime} onChange={(e)=>setNewTime(e.target.value)} placeholder="09:30" className="input-field" />
              <button onClick={addSlot} className="btn-primary inline-flex items-center"><Plus className="w-4 h-4 mr-1"/>Add</button>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-80 overflow-auto pr-1">
          {slots.map(s => (
            <div key={s.id || s.time} className="p-3 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 text-sm">{s.time}</div>
                <div className={`text-xs ${s.booked ? 'text-red-600' : 'text-green-600'}`}>{s.booked ? 'Booked' : 'Available'}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-4 h-4"/><span>Active</span>
                  <input type="checkbox" checked={!!s.active} onChange={(e)=>toggleActive(s.time, e.target.checked)} />
                </div>
                <button onClick={()=>removeSlot(s.time)} disabled={s.booked} className={`inline-flex items-center px-3 py-1 rounded border ${s.booked?'opacity-50 cursor-not-allowed':'text-red-700 bg-red-50 border-red-200'}`}>
                  <Trash2 className="w-4 h-4 mr-1"/>Delete
                </button>
              </div>
            </div>
          ))}
          {slots.length === 0 && (
            <div className="text-sm text-gray-500">No slots for this date. Add one above.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Availability;
