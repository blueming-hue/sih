import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listCounsellorResources, createCounsellorResource, updateCounsellorResource, deleteCounsellorResource, getCounsellorResources, getResources, uploadCounsellorResourceFile } from '../../firebase/firestore';
import { Plus, Save, X, Trash2, ExternalLink, Film, Music, BookOpen, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const Resources = () => {
  const { user } = useAuth();
  const ownerId = user?.uid;

  const [items, setItems] = useState([]); // owned
  const [allResources, setAllResources] = useState([]); // global student-visible resources
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', url: '', description: '', type: 'link' });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ title: '', url: '', description: '', type: 'link' });
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mine'
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const load = async () => {
    if (!ownerId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await listCounsellorResources(ownerId);
      if (res.success) setItems(res.data); else toast.error('Failed to load resources');
    } catch (e) {
      console.error(e); toast.error('Failed to load resources');
    }
    try {
      const global = await getResources();
      if (global.success) setAllResources(global.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [ownerId]);

  const add = async () => {
    if (!draft.title || !draft.url) { toast.error('Title and URL are required'); return; }
    const res = await createCounsellorResource(ownerId, draft);
    if (res.success) { toast.success('Resource added'); setDraft({ title:'', url:'', description:'', type:'link' }); setAdding(false); load(); }
    else toast.error(res.error || 'Failed to add');
  };

  const startEdit = (it) => {
    setEditingId(it.id);
    setEditDraft({ title: it.title || '', url: it.url || '', description: it.description || '', type: it.type || 'link' });
  };
  const saveEdit = async () => {
    const res = await updateCounsellorResource(editingId, editDraft);
    if (res.success) { toast.success('Updated'); setEditingId(null); load(); } else toast.error(res.error || 'Failed to update');
  };
  const remove = async (id) => {
    const res = await deleteCounsellorResource(id);
    if (res.success) { toast.success('Deleted'); load(); } else toast.error(res.error || 'Failed to delete');
  };

  const combined = useMemo(() => {
    const list = activeTab === 'mine' ? items : [...allResources, ...items];
    const ql = q.trim().toLowerCase();
    return list.filter(it => {
      const typeOk = typeFilter === 'all' || (it.type || 'link') === typeFilter;
      const text = `${it.title || ''} ${it.description || ''}`.toLowerCase();
      const qOk = !ql || text.includes(ql);
      return typeOk && qOk;
    });
  }, [activeTab, items, allResources, q, typeFilter]);

  const ResourceCard = ({ it, editable }) => {
    const type = it.type || 'link';
    const isYouTube = (u) => /youtu\.be|youtube\.com/.test(u || '');
    const getYouTubeEmbed = (u) => {
      try {
        const url = new URL(u);
        if (url.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
        if (url.hostname.includes('youtube.com')) {
          const v = url.searchParams.get('v');
          if (v) return `https://www.youtube.com/embed/${v}`;
        }
      } catch {}
      return null;
    };
    return (
      <div className="p-4 border rounded hover:shadow transition-shadow bg-white">
        <div className="mb-2">
          {type === 'video' && isYouTube(it.url) && getYouTubeEmbed(it.url) ? (
            <div className="aspect-video w-full rounded overflow-hidden">
              <iframe title={it.title} className="w-full h-full" src={getYouTubeEmbed(it.url)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          ) : type === 'audio' && /\.(mp3|wav|ogg)(\?.*)?$/i.test(it.url || '') ? (
            <audio controls className="w-full">
              <source src={it.url} />
            </audio>
          ) : (
            <a href={it.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary-600 hover:underline"><ExternalLink className="w-4 h-4 mr-1"/>Open</a>
          )}
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{it.title}</p>
            <p className="text-sm text-gray-600">{it.description}</p>
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 capitalize">
              {type === 'video' ? <Film className="w-3 h-3"/> : type === 'audio' ? <Music className="w-3 h-3"/> : <BookOpen className="w-3 h-3"/>}
              <span>{type}</span>
            </div>
          </div>
          {editable && (
            <div className="w-64">
              {editingId === it.id ? (
                <div className="space-y-2">
                  <input className="input-field" value={editDraft.title} onChange={(e)=>setEditDraft(d=>({...d, title:e.target.value}))} />
                  <input className="input-field" value={editDraft.url} onChange={(e)=>setEditDraft(d=>({...d, url:e.target.value}))} />
                  <input className="input-field" value={editDraft.description} onChange={(e)=>setEditDraft(d=>({...d, description:e.target.value}))} />
                  <div className="flex items-center gap-2">
                    <button onClick={saveEdit} className="btn-primary inline-flex items-center text-sm"><Save className="w-4 h-4 mr-1"/>Save</button>
                    <button onClick={()=>setEditingId(null)} className="btn-secondary inline-flex items-center text-sm"><X className="w-4 h-4 mr-1"/>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={()=>startEdit(it)} className="btn-secondary inline-flex items-center text-sm"><Save className="w-4 h-4 mr-1"/>Edit</button>
                  <button onClick={()=>remove(it.id)} className="inline-flex items-center text-sm px-3 py-2 border rounded text-red-700 bg-red-50 border-red-200"><Trash2 className="w-4 h-4 mr-1"/>Delete</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Resources</h1>
          <p className="text-gray-600">Browse all resources and manage your own materials.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search..." className="input-field pl-9 w-56"/>
          </div>
          <select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)} className="input-field">
            <option value="all">All Types</option>
            <option value="link">Links</option>
            <option value="video">Videos</option>
            <option value="audio">Audios</option>
            <option value="guide">Guides</option>
          </select>
          <button onClick={()=>setAdding(v=>!v)} className="btn-primary inline-flex items-center"><Plus className="w-4 h-4 mr-1"/>{adding?'Close':'Add Resource'}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-2">
        <button onClick={()=>setActiveTab('all')} className={`px-3 py-1 rounded ${activeTab==='all'?'bg-primary-600 text-white':'bg-gray-100 text-gray-700'}`}>All</button>
        <button onClick={()=>setActiveTab('mine')} className={`px-3 py-1 rounded ${activeTab==='mine'?'bg-primary-600 text-white':'bg-gray-100 text-gray-700'}`}>Mine</button>
      </div>

      {adding && (
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Title</label>
              <input className="input-field" value={draft.title} onChange={(e)=>setDraft(d=>({...d, title:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">URL</label>
              <input className="input-field" value={draft.url} onChange={(e)=>setDraft(d=>({...d, url:e.target.value}))} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Type</label>
              <select className="input-field" value={draft.type} onChange={(e)=>setDraft(d=>({...d, type:e.target.value}))}>
                <option value="link">Link</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="guide">Guide</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <input className="input-field" value={draft.description} onChange={(e)=>setDraft(d=>({...d, description:e.target.value}))} />
            </div>
          </div>
          <div className="mt-3">
            <button onClick={add} className="btn-primary inline-flex items-center"><Save className="w-4 h-4 mr-1"/>Save</button>
          </div>
          <div className="mt-4 border-t pt-4">
            <label className="block text-sm text-gray-700 mb-2">Or upload a file (audio/video/other)</label>
            <input type="file" accept="audio/*,video/*" onChange={async (e)=>{
              const file = e.target.files?.[0]; if (!file) return;
              const up = await uploadCounsellorResourceFile(ownerId, file);
              if (up.success) {
                const inferred = file.type.startsWith('audio') ? 'audio' : file.type.startsWith('video') ? 'video' : 'link';
                const res = await createCounsellorResource(ownerId, { title: file.name, url: up.url, description: '', type: inferred });
                if (res.success) { toast.success('File uploaded'); load(); }
                else toast.error(res.error || 'Failed to save item');
              } else {
                toast.error(up.error || 'Upload failed');
              }
              e.target.value = '';
            }} />
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{activeTab==='mine'?'Your Items':'All Resources'}</h2>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : combined.length === 0 ? (
          <div className="text-sm text-gray-500">No resources found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {combined.map(it => (
              <ResourceCard key={`${it.id}-${activeTab}`} it={it} editable={activeTab==='mine' && items.some(m=>m.id===it.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
