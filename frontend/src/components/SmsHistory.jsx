import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSmsHistory, exportSms } from '../api';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('uz');
}

const PAGE_SIZE = 20;

export default function SmsHistory({ refresh }) {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  // Filter state
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(0);

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const load = useCallback(async (p = page) => {
    try {
      const params = { limit: PAGE_SIZE, offset: p * PAGE_SIZE };
      if (search) params.search = search;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const r = await getSmsHistory(params);
      setHistory(r.data.data ?? r.data);
      setTotal(r.data.total ?? r.data.length);
    } finally {
      setLoading(false);
    }
  }, [search, fromDate, toDate, page]);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    load(0);
  }, [refresh, search, fromDate, toDate]);

  useEffect(() => {
    if (page > 0) load(page);
  }, [page]);

  // Auto-refresh every 3s
  useEffect(() => {
    const interval = setInterval(() => load(page), 3000);
    return () => clearInterval(interval);
  }, [load, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = search || fromDate || toDate;

  function handleExport() {
    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    window.open(exportSms(params), '_blank');
  }

  function clearFilters() {
    setSearch(''); setFromDate(''); setToDate(''); setPage(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="glass rounded-3xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
          </div>
          <h2 className="text-sm font-bold text-white/90">SMS Tarixi</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Export CSV */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleExport}
            className="w-7 h-7 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors"
            title="CSV yuklash"
          >
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          </motion.button>
          {/* Filter toggle */}
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilter(v => !v)}
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${showFilter || hasFilters ? 'bg-white/20 text-white' : 'glass text-white/50 hover:bg-white/10'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
          </motion.button>
          {!loading && total > 0 && (
            <span className="glass text-xs px-2.5 py-1 rounded-full text-white/40 tabular-nums">{total}</span>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2"
          >
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Xabar yoki raqam bo'yicha qidirish..."
              className="glass-input w-full rounded-xl px-3 py-2.5 text-xs"
            />
            <div className="flex gap-2">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="glass-input flex-1 rounded-xl px-3 py-2.5 text-xs" style={{ colorScheme: 'dark' }} />
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="glass-input flex-1 rounded-xl px-3 py-2.5 text-xs" style={{ colorScheme: 'dark' }} />
            </div>
            {hasFilters && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={clearFilters}
                className="w-full py-2 rounded-xl text-xs text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 transition-colors"
              >
                Filtrni tozalash
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-white/5" />

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : history.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 gap-3"
        >
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/15" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="text-xs text-white/25">
            {hasFilters ? 'Qidiruv natijasi topilmadi' : 'Hali SMS yuborilmagan'}
          </p>
        </motion.div>
      ) : (
        <ul className="space-y-2 max-h-[460px] overflow-y-auto custom-scroll pr-0.5">
          <AnimatePresence initial={false}>
            {history.map((s, i) => (
              <motion.li key={s.id} layout
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 360, damping: 30, delay: Math.min(i * 0.03, 0.18) }}
              >
                <div className="rounded-2xl p-3.5 border border-white/6 bg-white/4 hover:bg-white/6 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {s.phone_numbers?.length > 0 && (
                        <span className="text-xs text-white/35 tabular-nums font-medium">{s.phone_numbers.length} raqam</span>
                      )}
                      <span className="text-xs text-white/20 tabular-nums">{timeAgo(s.created_at)}</span>
                    </div>
                    {(s.devices?.device_name || s.device_name) && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-white/20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-xs text-white/20 truncate max-w-[80px]">
                          {s.devices?.device_name || s.device_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed line-clamp-2 mb-2.5">{s.message}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <AnimatePresence initial={false}>
                      {(expanded[s.id] ? s.phone_numbers : s.phone_numbers?.slice(0, 3))?.map(p => (
                        <motion.span key={p}
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="text-xs px-2 py-0.5 rounded-lg bg-white/6 text-white/40 font-mono tracking-wide"
                        >{p}</motion.span>
                      ))}
                    </AnimatePresence>
                    {s.phone_numbers?.length > 3 && (
                      <motion.button whileTap={{ scale: 0.93 }} onClick={() => toggleExpand(s.id)}
                        className="text-xs text-white/50 hover:text-white/80 px-2 py-0.5 rounded-lg bg-white/6 hover:bg-white/12 transition-all font-medium"
                      >
                        {expanded[s.id] ? 'Yopish' : `+${s.phone_numbers.length - 3} ta`}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="glass px-3 py-1.5 rounded-xl text-xs text-white/50 disabled:opacity-30 hover:text-white/80 transition-colors"
          >
            ← Oldingi
          </motion.button>
          <span className="text-xs text-white/30 tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="glass px-3 py-1.5 rounded-xl text-xs text-white/50 disabled:opacity-30 hover:text-white/80 transition-colors"
          >
            Keyingi →
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
