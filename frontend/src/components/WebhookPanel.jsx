import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getGroups, createGroup, deleteGroup } from '../api';

function parsePhones(text) {
  const matches = text.match(/[\+]?[0-9]{9,13}/g) || [];
  return [...new Set(matches)];
}

const TABS = ['url', 'manual', 'groups'];
const TAB_LABELS = { url: 'URL', manual: "Qo'lda", groups: 'Guruhlar' };

export default function WebhookPanel({ onPhones }) {
  const [tab, setTab] = useState('url');
  const [url, setUrl] = useState('');
  const [manual, setManual] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastTotal, setLastTotal] = useState(null);

  // Groups
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [currentPhones, setCurrentPhones] = useState([]); // phones to save as group

  useEffect(() => {
    if (tab === 'groups') loadGroups();
  }, [tab]);

  async function loadGroups() {
    setGroupsLoading(true);
    try {
      const r = await getGroups();
      setGroups(r.data);
    } finally {
      setGroupsLoading(false);
    }
  }

  async function handleFetch() {
    if (!url.trim()) return;
    setLoading(true); setError(''); setLastTotal(null);
    try {
      const res = await axios.post('/api/extract', { url: url.trim() });
      setLastTotal(res.data.total);
      setCurrentPhones(res.data.phones);
      onPhones(res.data.phones);
    } catch (err) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  function handleManual() {
    const phones = parsePhones(manual);
    if (phones.length === 0) { setError('Hech qanday raqam topilmadi'); return; }
    setError(''); setLastTotal(phones.length);
    setCurrentPhones(phones);
    onPhones(phones);
    setManual('');
  }

  async function handleSaveGroup() {
    if (!newGroupName.trim() || currentPhones.length === 0) return;
    setSavingGroup(true);
    try {
      const res = await createGroup({ name: newGroupName.trim(), phones: currentPhones });
      setGroups(prev => [res.data, ...prev]);
      setNewGroupName('');
    } finally {
      setSavingGroup(false);
    }
  }

  async function handleDeleteGroup(id, e) {
    e.stopPropagation();
    await deleteGroup(id).catch(() => {});
    setGroups(prev => prev.filter(g => g.id !== id));
  }

  function switchTab(id) { setTab(id); setError(''); setLastTotal(null); }

  const tabIcons = {
    url: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>,
    manual: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>,
    groups: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="space-y-4"
    >
      <div className="glass rounded-3xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h2 className="text-sm font-bold text-white/90">Raqam qidirish</h2>
        </div>

        <div className="border-t border-white/5" />

        {/* 3-tab toggle */}
        <div className="flex gap-1 p-1 glass rounded-2xl relative">
          {TABS.map((t) => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.95 }}
              onClick={() => switchTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1 relative z-10 ${tab === t ? 'text-black' : 'text-white/40 hover:text-white/60'}`}
            >
              {tab === t && (
                <motion.div layoutId="webhookTabPill" className="absolute inset-0 rounded-xl bg-white"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <span className="relative z-10 flex items-center gap-1">
                {tabIcons[t]}
                {TAB_LABELS[t]}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === 'url' && (
            <motion.div key="url"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }} transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="space-y-2.5"
            >
              <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFetch()}
                placeholder="https://example.com/data.json"
                className="glass-input w-full rounded-2xl px-4 py-3 text-sm" />
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleFetch}
                disabled={loading || !url.trim()}
                className="glass-btn-primary w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5"
              >
                <AnimatePresence mode="wait">
                  {loading
                    ? <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Yuklanmoqda...
                      </motion.span>
                    : <motion.span key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        Yuklash
                      </motion.span>
                  }
                </AnimatePresence>
              </motion.button>
              {/* Save as group */}
              {lastTotal > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveGroup()}
                    placeholder="Guruh nomi (ixtiyoriy)..."
                    className="glass-input flex-1 rounded-xl px-3 py-2 text-xs" />
                  <motion.button whileTap={{ scale: 0.94 }} onClick={handleSaveGroup}
                    disabled={savingGroup || !newGroupName.trim()}
                    className="glass-btn px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap"
                  >
                    {savingGroup ? '...' : 'Guruhga saqlash'}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {tab === 'manual' && (
            <motion.div key="manual"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="space-y-2.5"
            >
              <textarea value={manual} onChange={e => setManual(e.target.value)}
                placeholder={`998901234567\n998711234567\n+998901112233\n\nVergul bilan ham bo'ladi`}
                rows={5} className="glass-input w-full rounded-2xl px-4 py-3 text-sm resize-none font-mono leading-relaxed" />
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleManual}
                disabled={!manual.trim()}
                className="glass-btn-primary w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Qo'shish
              </motion.button>
              {lastTotal > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveGroup()}
                    placeholder="Guruh nomi (ixtiyoriy)..."
                    className="glass-input flex-1 rounded-xl px-3 py-2 text-xs" />
                  <motion.button whileTap={{ scale: 0.94 }} onClick={handleSaveGroup}
                    disabled={savingGroup || !newGroupName.trim()}
                    className="glass-btn px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap"
                  >
                    {savingGroup ? '...' : 'Guruhga saqlash'}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {tab === 'groups' && (
            <motion.div key="groups"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="space-y-2"
            >
              {groupsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white/15" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                  </div>
                  <p className="text-xs text-white/25 text-center">
                    Guruh yo'q.<br/>
                    <span className="text-white/15">URL yoki qo'lda raqam qo'shib, guruhga saqlang.</span>
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto custom-scroll">
                  <AnimatePresence>
                    {groups.map((g, i) => (
                      <motion.li key={g.id}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => { onPhones(g.phones); setLastTotal(g.phones.length); }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white/85 truncate">{g.name}</p>
                          <p className="text-xs text-white/35">{g.phones?.length} ta raqam</p>
                        </div>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={e => handleDeleteGroup(g.id, e)}
                          className="w-7 h-7 rounded-lg bg-red-500/0 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                        </motion.button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback */}
        <AnimatePresence>
          {error && (
            <motion.div key="err"
              initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              className="rounded-2xl px-4 py-3 flex items-center gap-2.5 bg-red-500/10 border border-red-500/15"
            >
              <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              <p className="text-red-300 text-xs">{error}</p>
            </motion.div>
          )}
          {lastTotal !== null && !error && tab !== 'groups' && (
            <motion.div key="ok"
              initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              className="rounded-2xl px-4 py-3 flex items-center gap-2.5 bg-green-500/10 border border-green-500/15"
            >
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              <p className="text-white/70 text-xs">
                {lastTotal > 0
                  ? <><span className="text-green-300 font-semibold">{lastTotal} ta</span> raqam qo'shildi</>
                  : 'Raqam topilmadi'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
