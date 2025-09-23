import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  subscribeAllCounsellors,
  updateCounsellorActive,
  subscribeAvailabilitySlots,
  upsertAvailabilitySlot,
  deleteAvailabilitySlot
} from '../../firebase/firestore';
import { Users, CheckCircle2, XCircle, Calendar, Clock, ToggleLeft, ToggleRight, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CounsellorsAdmin = () => {
  const { userData } = useAuth();
  const [counsellors, setCounsellors] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [newTime, setNewTime] = useState(''); // HH:mm

  useEffect(() => {
    const unsub = subscribeAllCounsellors(
      (items) => setCounsellors(items),
      (err) => {
        console.error('Failed to load counsellors', err);
        toast.error('Failed to load counsellors');
      },
      500
    );
    return () => unsub && unsub();
  }, []);

  // Subscribe to availability when both selected
  useEffect(() => {
    let unsub;
    if (selectedId && selectedDate) {
      unsub = subscribeAvailabilitySlots(
        selectedId,
        selectedDate,
        (items) => setSlots(items),
        (err) => {
          console.error('Failed to load availability', err);
          toast.error('Failed to load availability');
        }
      );
    } else {
      setSlots([]);
    }
    return () => unsub && unsub();
  }, [selectedId, selectedDate]);

  const toggleActive = async (c) => {
    const next = !c.active;
    const res = await updateCounsellorActive(c.id, next);
    if (res.success) toast.success(`Counsellor ${next ? 'approved' : 'disabled'}`);
    else toast.error(res.error || 'Failed to update status');
  };

  const addSlot = async () => {
    try {
      if (!selectedId || !selectedDate || !newTime) return;
      const ok = /^\d{2}:\d{2}$/.test(newTime);
      if (!ok) {
        toast.error('Time must be HH:mm');
        return;
      }
      const res = await upsertAvailabilitySlot(selectedId, selectedDate, newTime);
      if (res.success) {
        toast.success('Slot added');
        setNewTime('');
      } else {
        toast.error(res.error || 'Failed to add slot');
      }
    } catch (e) {
      toast.error('Failed to add slot');
    }
  };

  const clearSlot = async (time) => {
    try {
      const res = await deleteAvailabilitySlot(selectedId, selectedDate, time);
      if (res.success) toast.success('Slot cleared');
      else toast.error(res.error || 'Failed to clear slot');
    } catch (e) {
      toast.error('Failed to clear slot');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Counsellors Admin</h1>
            <p className="text-gray-600 mt-2">Approve counsellors and manage availability slots.</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-5 h-5" />
            <span>{counsellors.length} total</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Counsellor list */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Counsellors</h2>
            <div className="divide-y divide-gray-100">
              {counsellors.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div onClick={() => setSelectedId(c.id)} className="flex-1 cursor-pointer">
                    <p className="font-medium text-gray-900">
                      {c.name} <span className="text-sm text-gray-500">({c.email})</span>
                    </p>
                    <p className="text-sm text-gray-600">{c.specialization || '—'} • {c.experience ? `${c.experience} yrs` : 'exp n/a'}</p>
                    <p className="text-xs text-gray-500">Status: {c.active ? 'Active' : 'Pending/Disabled'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`inline-flex items-center px-3 py-1 rounded border ${c.active ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-700 bg-gray-50 border-gray-200'}`}
                    >
                      {c.active ? <ToggleRight className="w-4 h-4 mr-1"/> : <ToggleLeft className="w-4 h-4 mr-1"/>}
                      {c.active ? 'Active' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className="inline-flex items-center px-3 py-1 rounded border text-gray-700 bg-white hover:bg-gray-50 border-gray-200"
                    >
                      <Calendar className="w-4 h-4 mr-1"/> Manage Slots
                    </button>
                  </div>
                </div>
              ))}
              {counsellors.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-500">No counsellors found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Availability editor */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selected Counsellor</label>
                <select value={selectedId} onChange={(e)=>setSelectedId(e.target.value)} className="input-field">
                  <option value="">Select counsellor</option>
                  {counsellors.map((c)=> (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
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
                <div className="flex flex-wrap gap-2 mt-2">
                  {["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00"].map((t)=>(
                    <button key={t} type="button" onClick={()=>setNewTime(t)} className="px-2 py-1 text-xs border rounded">{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slots</label>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {slots.map((s)=> (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500"/>
                        <span className="font-medium text-gray-900">{s.time}</span>
                        <span className={`text-xs ${s.booked ? 'text-red-600' : 'text-green-600'}`}>{s.booked ? 'Booked' : 'Available'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!s.booked && (
                          <button onClick={()=>clearSlot(s.time)} className="inline-flex items-center px-2 py-1 text-xs border rounded text-gray-700 hover:bg-gray-100"><Trash2 className="w-3 h-3 mr-1"/>Clear</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedId && selectedDate && slots.length === 0 && (
                    <div className="text-xs text-gray-500">No slots for this date. Add one above.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounsellorsAdmin;
