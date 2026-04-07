import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDevices, sendSms, getTemplates, createTemplate, deleteTemplate, scheduleSms } from '../api';

const MAX_SMS = 160;

export default function SendSmsForm({ selected, lastLogId, onSent }) {
  const [message, setMessage] = useState('');
  const [method, setMethod] = useState('android');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [savingTpl, setSavingTpl] = useState(false);

  // Schedule
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduleResult, setScheduleResult] = useState(null);

  useEffect(() => {
    getDevices().then((r) => {
      setDevices(r.data.filter((d) => d.platform === 'android' && d.status === 'online'));
    });
    getTemplates().then((r) => setTemplates(r.data)).catch(() => {});
  }, []);

  async function handleSend() {
    if (!message.trim() || selected.size === 0) return;
    if (scheduleMode) {
      if (!scheduledAt) return;
      setLoading(true);
      setScheduleResult(null);
      try {
        await scheduleSms({ phoneNumbers: [...selected], message, method, scheduledAt: new Date(scheduledAt).toISOString() });
        setScheduleResult({ ok: true, text: `${selected.size} ta raqam jadvalga qo'shildi!` });
        setMessage('');
        setScheduledAt('');
      } catch {
        setScheduleResult({ ok: false, text: 'Xatolik yuz berdi' });
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      await sendSms({ phoneNumbers: [...selected], message, method, webhookLogId: lastLogId || null });
      setResult({ ok: true, text: `${selected.size} ta raqamga yuborildi!` });
      setMessage('');
      onSent();
    } catch {
      setResult({ ok: false, text: 'Xatolik yuz berdi' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTemplate() {
    if (!newTplName.trim() || !message.trim()) return;
    setSavingTpl(true);
    try {
      const res = await createTemplate({ name: newTplName.trim(), message: message.trim() });
      setTemplates(prev => [res.data, ...prev]);
      setNewTplName('');
      setShowTemplates(false);
    } finally {
      setSavingTpl(false);
    }
  }

  async function handleDeleteTemplate(id, e) {
    e.stopPropagation();
    await deleteTemplate(id).catch(() => {});
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  const canSend = message.trim() && selected.size > 0 &&
    (method === 'eskiz' || (method === 'android' && devices.length > 0)) &&
    (!scheduleMode || scheduledAt);

  const charPercent = Math.min((message.length / MAX_SMS) * 100, 100);
  const charColor = message.length > MAX_SMS ? '#f87171' : message.length > MAX_SMS * 0.8 ? '#fbbf24' : '#ffffff';

  // min datetime-local value = now
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

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
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-white/90">SMS Yuborish</h2>
        </div>
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              className="glass text-xs px-2.5 py-1 rounded-full text-white/60"
            >
              <span className="text-white font-bold">{selected.size}</span> raqam
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-white/5" />

      {/* Method toggle */}
      <div className="flex gap-1 p-1 glass rounded-2xl relative">
        {[
          { id: 'android', label: 'Android', icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg> },
          { id: 'eskiz', label: 'Eskiz.uz', icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118zM4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9z" clipRule="evenodd"/></svg> },
        ].map((m) => (
          <motion.button key={m.id} whileTap={{ scale: 0.95 }} onClick={() => setMethod(m.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 relative z-10 ${method === m.id ? 'text-black' : 'text-white/40 hover:text-white/60'}`}
          >
            {method === m.id && (
              <motion.div layoutId="methodPill" className="absolute inset-0 rounded-xl bg-white"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
            <span className="relative z-10 flex items-center gap-1.5">{m.icon}{m.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Device status */}
      <AnimatePresence mode="wait">
        {method === 'android' && (
          <motion.div key="dev" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`rounded-2xl px-4 py-3 flex items-center gap-2.5 overflow-hidden ${devices.length > 0 ? 'bg-green-500/10 border border-green-500/15' : 'bg-yellow-500/10 border border-yellow-500/15'}`}
          >
            {devices.length > 0 ? (
              <>
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                <p className="text-green-300 text-xs font-medium">{devices[0].device_name || 'Android'} — tayyor</p>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <p className="text-yellow-300/80 text-xs">Online Android qurilma yo'q</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Textarea + template bar */}
      <div className="space-y-2">
        {/* Template button row */}
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs text-white/30">Xabar matni</span>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowTemplates(v => !v)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors ${showTemplates ? 'bg-white/15 text-white' : 'bg-white/6 text-white/40 hover:text-white/70'}`}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
            </svg>
            Shablonlar {templates.length > 0 && <span className="text-white/50">({templates.length})</span>}
          </motion.button>
        </div>

        {/* Templates panel */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-2xl p-3 space-y-2">
                {/* Save current as template */}
                {message.trim() && (
                  <div className="flex gap-2">
                    <input
                      value={newTplName}
                      onChange={e => setNewTplName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                      placeholder="Shablon nomi..."
                      className="glass-input flex-1 rounded-xl px-3 py-2 text-xs"
                    />
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={handleSaveTemplate}
                      disabled={savingTpl || !newTplName.trim()}
                      className="glass-btn-primary px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      {savingTpl ? '...' : 'Saqlash'}
                    </motion.button>
                  </div>
                )}
                {templates.length === 0 ? (
                  <p className="text-xs text-white/25 text-center py-2">Shablon yo'q. Xabar yozing va saqlang.</p>
                ) : (
                  <ul className="space-y-1 max-h-36 overflow-y-auto custom-scroll">
                    {templates.map(t => (
                      <li key={t.id}
                        onClick={() => { setMessage(t.message); setShowTemplates(false); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white/80 truncate">{t.name}</p>
                          <p className="text-xs text-white/35 truncate">{t.message}</p>
                        </div>
                        <button
                          onClick={e => handleDeleteTemplate(t.id, e)}
                          className="w-5 h-5 rounded-lg bg-red-500/0 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Xabar matnini yozing..."
          rows={4}
          className="glass-input w-full rounded-2xl px-4 py-3 text-sm resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-white/30">
            {selected.size > 0
              ? <><span className="text-white/60 font-medium">{selected.size}</span> raqam tanlandi</>
              : 'Raqam tanlanmagan'}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full rounded-full"
                animate={{ width: `${charPercent}%`, backgroundColor: charColor }}
                transition={{ duration: 0.2 }} style={{ opacity: 0.7 }} />
            </div>
            <span className="text-xs tabular-nums" style={{ color: `${charColor}99` }}>
              {message.length}/{MAX_SMS}
            </span>
          </div>
        </div>
      </div>

      {/* Schedule toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-white/40" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
          <span className="text-xs text-white/40">Jadval bo'yicha</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setScheduleMode(v => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${scheduleMode ? 'bg-white/40' : 'bg-white/10'}`}
        >
          <motion.div
            animate={{ x: scheduleMode ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
          />
        </motion.button>
      </div>

      {/* Schedule datetime picker */}
      <AnimatePresence>
        {scheduleMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <input
              type="datetime-local"
              value={scheduledAt}
              min={nowLocal}
              onChange={e => setScheduledAt(e.target.value)}
              className="glass-input w-full rounded-2xl px-4 py-3 text-sm"
              style={{ colorScheme: 'dark' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send / Schedule button */}
      <motion.button
        whileTap={canSend && !loading ? { scale: 0.97 } : {}}
        onClick={handleSend}
        disabled={loading || !canSend}
        className="glass-btn-primary w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5"
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {scheduleMode ? 'Jadvalga qo\'shilmoqda...' : 'Yuborilmoqda...'}
            </motion.span>
          ) : (
            <motion.span key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5">
              {scheduleMode ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              )}
              {scheduleMode
                ? (scheduledAt ? `Jadvalga qo'shish` : 'Vaqt tanlang')
                : (selected.size > 0 ? `${selected.size} ta raqamga yuborish` : 'Yuborish')}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Results */}
      <AnimatePresence>
        {(result || scheduleResult) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`rounded-2xl px-4 py-3 flex items-center gap-2.5 ${
              (result || scheduleResult)?.ok
                ? 'bg-green-500/10 border border-green-500/15'
                : 'bg-red-500/10 border border-red-500/15'
            }`}
          >
            {(result || scheduleResult)?.ok
              ? <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              : <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            }
            <p className={`text-xs font-medium ${(result || scheduleResult)?.ok ? 'text-green-300' : 'text-red-300'}`}>
              {(result || scheduleResult)?.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
