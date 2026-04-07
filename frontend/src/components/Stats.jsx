import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStats, getDevices } from '../api';

function BarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.phones), 1);

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-20">
        {data.map((d, i) => {
          const h = Math.max((d.phones / max) * 100, d.phones > 0 ? 8 : 2);
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group">
              <div className="relative w-full flex items-end justify-center" style={{ height: 72 }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24, delay: i * 0.05 }}
                  className={`w-full rounded-t-md ${d.phones > 0 ? 'bg-white/30 group-hover:bg-white/50' : 'bg-white/8'} transition-colors`}
                  style={{ minHeight: 2 }}
                />
                {d.phones > 0 && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.phones}
                  </div>
                )}
              </div>
              <span className="text-[8px] text-white/25">
                {new Date(d.date).toLocaleDateString('uz', { day: 'numeric', month: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28, delay }}
      className="glass rounded-2xl p-4 flex items-center gap-3"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-white tabular-nums">{value ?? '—'}</p>
        <p className="text-xs text-white/40 truncate">{label}</p>
        {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [s, d] = await Promise.all([getStats(), getDevices()]);
      setStats(s.data);
      setDevices(d.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4">

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Jami SMS"
            value={stats?.totalSms}
            sub={`Bugun: ${stats?.todayCount}`}
            color="bg-white/10"
            delay={0}
            icon={<svg className="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/></svg>}
          />
          <StatCard
            label="Yuborildi"
            value={stats?.sentCount}
            sub={stats?.totalSms ? `${Math.round((stats.sentCount / stats.totalSms) * 100)}%` : ''}
            color="bg-green-500/15"
            delay={0.06}
            icon={<svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>}
          />
          <StatCard
            label="Xatolik"
            value={stats?.failedCount}
            color="bg-red-500/15"
            delay={0.12}
            icon={<svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>}
          />
          <StatCard
            label="Qurilmalar"
            value={stats ? `${stats.onlineDevices}/${stats.totalDevices}` : '—'}
            sub="online"
            color={stats?.onlineDevices > 0 ? 'bg-sky-500/15' : 'bg-white/8'}
            delay={0.18}
            icon={<svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>}
          />
        </div>
      )}

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.2 }}
        className="glass rounded-3xl p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white/90">So'nggi 7 kun</span>
          </div>
          <span className="text-xs text-white/30">SMS soni</span>
        </div>
        <div className="border-t border-white/5" />
        {loading
          ? <div className="skeleton h-24 rounded-xl" />
          : <BarChart data={stats?.chart} />
        }
      </motion.div>

      {/* Devices */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.26 }}
        className="glass rounded-3xl p-5 space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white/70" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-white/90">Qurilmalar</span>
        </div>
        <div className="border-t border-white/5" />
        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : devices.length === 0 ? (
          <p className="text-xs text-white/25 text-center py-6">Qurilma ulanmagan</p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence>
              {devices.map((d, i) => (
                <motion.li
                  key={d.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl ${d.status === 'online' ? 'bg-white/8 border border-white/10' : 'bg-white/3 border border-white/5'}`}
                >
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    {d.status === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${d.status === 'online' ? 'bg-green-400' : 'bg-white/20'}`} />
                  </span>
                  <span className={`text-sm flex-1 truncate font-medium ${d.status === 'online' ? 'text-white/85' : 'text-white/25'}`}>
                    {d.device_name || 'Nomsiz'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase ${d.platform === 'android' ? 'text-sky-300 bg-sky-500/10' : 'text-purple-300 bg-purple-500/10'}`}>
                    {d.platform}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.div>

    </div>
  );
}
