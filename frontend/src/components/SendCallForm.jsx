import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDevices, sendCall } from '../api';

export default function SendCallForm({ selected, onSent, connected }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    getDevices().then((r) => {
      setDevices(r.data.filter((d) => d.platform === 'android'));
    });
  }, []);

  async function handleCall() {
    if (selected.size === 0) return;
    setLoading(true);
    setResult(null);
    try {
      await sendCall({ phoneNumbers: [...selected] });
      setResult({ ok: true, text: `${selected.size} ta raqamga qo'ng'iroq yuborildi!` });
      onSent();
    } catch {
      setResult({ ok: false, text: 'Xatolik yuz berdi' });
    } finally {
      setLoading(false);
    }
  }

  // Socket ulanganmi — database statusidan mustaqil
  const onlineCount = connected ? (devices.length || 1) : 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="glass-dark rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Qo'ng'iroq</p>
            <p className="text-xs text-white/40">Android qurilma orqali</p>
          </div>
        </div>
      </div>

      {/* Device status */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-white/50">Qurilmalar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`relative flex h-1.5 w-1.5 ${onlineCount > 0 ? '' : 'opacity-30'}`}>
              {onlineCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${onlineCount > 0 ? 'bg-purple-400' : 'bg-white/20'}`} />
            </span>
            <span className={`text-xs font-semibold ${onlineCount > 0 ? 'text-purple-300' : 'text-white/30'}`}>
              {onlineCount > 0 ? `${onlineCount} ta ulangan` : 'Qurilma yo\'q'}
            </span>
          </div>
        </div>
      </div>

      {/* Selected phones info */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">Tanlangan</span>
          <span className="text-sm font-bold text-white tabular-nums">
            {selected.size} ta raqam
          </span>
        </div>
        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scroll">
            {[...selected].slice(0, 20).map((p) => (
              <span key={p} className="text-[10px] bg-white/8 rounded-lg px-2 py-1 text-white/60 font-mono">
                {p}
              </span>
            ))}
            {selected.size > 20 && (
              <span className="text-[10px] bg-white/5 rounded-lg px-2 py-1 text-white/30">
                +{selected.size - 20} ta
              </span>
            )}
          </div>
        )}
      </div>

      {/* Warning */}
      <div className="glass rounded-2xl p-3 flex items-start gap-2.5">
        <svg className="w-4 h-4 text-yellow-400/70 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-[11px] text-white/40 leading-relaxed">
          Har bir qo'ng'iroq ketma-ket amalga oshiriladi. 30 soniyadan javob bo'lmasa avtomatik tugatiladi.
        </p>
      </div>

      {/* Call button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleCall}
        disabled={loading || selected.size === 0 || onlineCount === 0}
        className="glass-dark rounded-2xl py-4 flex items-center justify-center gap-2.5 disabled:opacity-40 transition-opacity"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-purple-400/50 border-t-purple-400 rounded-full animate-spin" />
            <span className="text-sm font-semibold text-purple-300">Yuborilmoqda...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.042 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            <span className="text-sm font-semibold text-white">
              {selected.size > 0 ? `${selected.size} ta raqamga qo'ng'iroq` : "Raqam tanlanmagan"}
            </span>
          </>
        )}
      </motion.button>

      {/* Result toast */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`rounded-2xl p-4 flex items-center gap-3 ${
              result.ok ? 'bg-purple-500/15 border border-purple-500/25' : 'bg-red-500/15 border border-red-500/25'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              result.ok ? 'bg-purple-500/20' : 'bg-red-500/20'
            }`}>
              {result.ok ? (
                <svg className="w-4 h-4 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`text-sm font-medium ${result.ok ? 'text-purple-200' : 'text-red-200'}`}>
              {result.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
