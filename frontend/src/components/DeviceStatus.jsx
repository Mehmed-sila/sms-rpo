import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDevices } from '../api';

export default function DeviceStatus() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDevices().then((r) => { setDevices(r.data); setLoading(false); });
    const interval = setInterval(() => {
      getDevices().then((r) => setDevices(r.data));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = devices.filter((d) => d.status === 'online').length;

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
              <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-white/90">Qurilmalar</h2>
        </div>

        <AnimatePresence>
          {!loading && devices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`flex items-center gap-1.5 glass px-2.5 py-1 rounded-full ${
                onlineCount > 0 ? 'bg-green-500/10' : 'bg-white/5'
              }`}
            >
              {onlineCount > 0 && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                </span>
              )}
              {onlineCount === 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              )}
              <span className={`text-xs font-semibold ${onlineCount > 0 ? 'text-green-300' : 'text-white/30'}`}>
                {onlineCount}/{devices.length} online
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-white/5" />

      {/* Skeleton */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="skeleton h-14 rounded-2xl" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-10 gap-3"
        >
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/15" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-white/25 text-center leading-relaxed">
            Qurilma ulanmagan<br/>
            <span className="text-white/15">Android ilovani ishga tushiring</span>
          </p>
        </motion.div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {devices.map((d, i) => (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, x: -16, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 360, damping: 30, delay: i * 0.06 }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors ${
                  d.status === 'online'
                    ? 'bg-white/8 border border-white/12'
                    : 'bg-white/3 border border-white/5'
                }`}
              >
                {/* Status dot */}
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  {d.status === 'online' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    d.status === 'online' ? 'bg-green-400' : 'bg-white/15'
                  }`} />
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    d.status === 'online' ? 'text-white/90' : 'text-white/25'
                  }`}>
                    {d.device_name || 'Nomsiz qurilma'}
                  </p>
                  {d.status === 'online' && (
                    <p className="text-xs text-white/30 mt-0.5">Faol</p>
                  )}
                </div>

                {/* Platform badge */}
                <span className={`text-xs px-2 py-0.5 rounded-lg font-bold uppercase tracking-wide ${
                  d.platform === 'android'
                    ? 'text-sky-300 bg-sky-500/10'
                    : 'text-purple-300 bg-purple-500/10'
                }`}>
                  {d.platform}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.div>
  );
}
