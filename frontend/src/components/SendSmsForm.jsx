import { useEffect, useState } from 'react';
import { getDevices, sendSms } from '../api';

const MAX_SMS = 160;

export default function SendSmsForm({ selected, lastLogId, onSent }) {
  const [message, setMessage] = useState('');
  const [method, setMethod] = useState('android');
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    getDevices().then((r) => {
      const android = r.data.filter((d) => d.platform === 'android' && d.status === 'online');
      setDevices(android);
    });
  }, []);

  async function handleSend() {
    if (!message.trim() || selected.size === 0) return;

    setLoading(true);
    setResult(null);
    try {
      await sendSms({
        phoneNumbers: [...selected],
        message,
        method,
        webhookLogId: lastLogId || null,
      });
      setResult({
        ok: true,
        text: method === 'android' ? 'Android ga buyruq yuborildi!' : 'Eskiz.uz orqali yuborildi!',
      });
      setMessage('');
      onSent();
    } catch {
      setResult({ ok: false, text: 'Xatolik yuz berdi' });
    } finally {
      setLoading(false);
    }
  }

  const canSend =
    message.trim() &&
    selected.size > 0 &&
    (method === 'eskiz' || (method === 'android' && devices.length > 0));

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / MAX_SMS) || 1;
  const overLimit = charCount > MAX_SMS * 3;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-white">SMS Yuborish</h2>
      </div>

      {/* Method toggle */}
      <div className="flex gap-1.5 p-1 bg-gray-800 rounded-xl">
        {[
          { id: 'android', label: 'Android', icon: '📱' },
          { id: 'eskiz', label: 'Eskiz.uz', icon: '🌐' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              method === m.id
                ? m.id === 'android'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-base leading-none">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Device info */}
      {method === 'android' && (
        devices.length === 0 ? (
          <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Online Android qurilma yo'q
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            📱 {devices[0].device_name || 'Android'} — tayyor
          </div>
        )
      )}

      {method === 'eskiz' && (
        <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Eskiz.uz API orqali to'g'ridan-to'g'ri yuboriladi
        </div>
      )}

      {/* Message textarea */}
      <div className="space-y-1.5">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Xabar matnini yozing..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-gray-600 transition-all"
        />
        <div className="flex justify-between px-0.5">
          <span className="text-xs text-gray-600">
            {selected.size > 0 ? (
              <span className="text-indigo-400">{selected.size} raqam tanlandi</span>
            ) : (
              'Raqam tanlanmagan'
            )}
          </span>
          <span className={`text-xs ${overLimit ? 'text-red-400' : charCount > MAX_SMS ? 'text-amber-400' : 'text-gray-600'}`}>
            {charCount}/{MAX_SMS}
            {smsCount > 1 && <span className="ml-1 text-gray-600">({smsCount} SMS)</span>}
          </span>
        </div>
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={loading || !canSend}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
          bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
          disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
          text-white shadow-lg shadow-indigo-500/20 disabled:shadow-none"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Yuborilmoqda...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            Yuborish
          </>
        )}
      </button>

      {result && (
        <div className={`flex items-center gap-2 text-xs rounded-xl px-3.5 py-2.5 ${
          result.ok
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            : 'text-red-400 bg-red-500/10 border border-red-500/20'
        }`}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            {result.ok
              ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              : <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            }
          </svg>
          {result.text}
        </div>
      )}
    </div>
  );
}
