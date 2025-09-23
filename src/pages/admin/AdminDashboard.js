import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, MessageCircle, Calendar, Shield, Search, CheckCircle2, XCircle, AlertTriangle, Trash2
} from 'lucide-react';
import {
  getAdminOverviewCounts,
  subscribeAllCounsellors,
  updateCounsellorActive,
  subscribeAppointments,
  searchStudents,
  subscribeFlaggedPosts,
  deleteForumPost
} from '../../firebase/firestore';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({ totalStudents: 0, totalCounsellors: 0, upcomingAppointments: 0, pendingCounsellors: 0, activeSessionsToday: 0 });
  const [counsellors, setCounsellors] = useState([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [appts, setAppts] = useState([]);
  const [apptFilter, setApptFilter] = useState({ counsellorId: '', studentId: '' });
  const [flagged, setFlagged] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getAdminOverviewCounts();
      if (mounted) {
        if (res.success) setOverview(res.data); else toast.error('Failed to load overview');
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const unsub = subscribeAllCounsellors((items)=> setCounsellors(items), (e)=>console.error(e));
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeAppointments(apptFilter, (items)=> setAppts(items), (e)=>console.error(e));
    return () => unsub && unsub();
  }, [apptFilter]);

  useEffect(() => {
    const unsub = subscribeFlaggedPosts((items)=> setFlagged(items), (e)=>console.error(e));
    return () => unsub && unsub();
  }, []);

  const runStudentSearch = async () => {
    const res = await searchStudents(studentQuery);
    if (res.success) setStudents(res.data); else toast.error('Failed to search students');
  };

  const toggleActive = async (c) => {
    const next = !c.active; const res = await updateCounsellorActive(c.id, next);
    if (!res.success) toast.error('Failed to update status');
  };

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
            <p className="text-gray-600 mt-2">Overview, approvals, and moderation</p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Admin Access</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="card"><p className="text-sm text-gray-600">Total Students</p><p className="text-2xl font-bold">{overview.totalStudents}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Total Counsellors</p><p className="text-2xl font-bold">{overview.totalCounsellors}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Active Sessions Today</p><p className="text-2xl font-bold">{overview.activeSessionsToday}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Upcoming Appointments</p><p className="text-2xl font-bold">{overview.upcomingAppointments}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Pending Approvals</p><p className="text-2xl font-bold">{overview.pendingCounsellors}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Management */}
        <div className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <Link to="/admin/counsellors" className="text-sm text-primary-600 hover:underline">Manage Counsellors</Link>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={studentQuery} onChange={(e)=>setStudentQuery(e.target.value)} placeholder="name/email/college..." className="input-field pl-10" />
            </div>
            <button onClick={runStudentSearch} className="btn-secondary mb-4">Search</button>
            <div className="max-h-64 overflow-auto space-y-2">
              {students.map(s => (
                <div key={s.id} className="p-2 bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-900">{s.collegeEmail || s.userId}</p>
                  <p className="text-xs text-gray-600">{s.collegeName} • Year {s.year || '—'}</p>
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-xs text-gray-500">Use the search to view students.</p>
              )}
            </div>
          </div>
        </div>

        {/* Counsellor Management */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Counsellor Management</h3>
            <p className="text-sm text-gray-500">Pending: {counsellors.filter(c=>!c.active).length}</p>
          </div>
          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {counsellors.map((c)=> (
              <div key={c.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{c.name} <span className="text-xs text-gray-500">({c.email})</span></p>
                  <p className="text-sm text-gray-600">{c.specialization || '—'} • {c.experience ? `${c.experience} yrs` : 'exp n/a'} • Rating {c.rating ?? '—'}</p>
                  <p className="text-xs text-gray-500">Status: {c.active ? 'Active' : 'Pending/Disabled'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>toggleActive(c)} className={`inline-flex items-center px-3 py-1 rounded border ${c.active ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>{c.active ? 'Deactivate' : 'Activate'}</button>
                  <Link to="/admin/counsellors" className="text-sm text-primary-600">Edit</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments Management */}
      <div className="mt-8 card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>
          <div className="flex items-center gap-2">
            <input value={apptFilter.counsellorId} onChange={(e)=>setApptFilter(f=>({...f, counsellorId: e.target.value}))} placeholder="Filter by counsellorId" className="input-field" />
            <input value={apptFilter.studentId} onChange={(e)=>setApptFilter(f=>({...f, studentId: e.target.value}))} placeholder="Filter by studentId" className="input-field" />
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-auto">
          {appts.map(a => (
            <div key={a.id} className="p-3 bg-gray-50 rounded flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{a.appointmentDate} {a.appointmentTime} • {a.sessionType}</p>
                <p className="text-xs text-gray-600">Student: {a.studentId} • Counsellor: {a.counsellorId}</p>
              </div>
              <div className="text-xs text-gray-500">Status: {a.status}</div>
            </div>
          ))}
          {appts.length === 0 && (
            <p className="text-sm text-gray-500">No appointments found for the given filters.</p>
          )}
        </div>
      </div>

      {/* Forum Moderation */}
      <div className="mt-8 card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Forum Moderation</h3>
          <p className="text-sm text-gray-500">Flagged: {flagged.length}</p>
        </div>
        <div className="space-y-2 max-h-96 overflow-auto">
          {flagged.map(p => (
            <div key={p.id} className="p-3 border rounded">
              <p className="font-medium text-gray-900">{p.title}</p>
              <p className="text-sm text-gray-700 mb-2">{p.content}</p>
              <div className="flex items-center gap-2">
                <button onClick={async ()=>{ const r = await deleteForumPost(p.id); if(!r.success) toast.error('Delete failed'); }} className="inline-flex items-center px-3 py-1 rounded border text-red-700 bg-red-50 border-red-200"><Trash2 className="w-4 h-4 mr-1"/>Delete</button>
              </div>
            </div>
          ))}
          {flagged.length === 0 && <p className="text-sm text-gray-500">No flagged posts.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
