import { useEffect, useState } from 'react';
import { getSmsHistory } from '../api';

const STATUS = {
  pending: { label: 'Kutilmoqda', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  sent:    { label: 'Yuborildi',  cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  failed:  { label: 'Xatolik',   cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s oldin`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h oldin`;
  return new Date(dateStr).toLocaleDateString('uz');
}

export default function SmsHistory({ refresh }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getSmsHistory().then((r) => setHistory(r.data));
  }, [refresh]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">SMS Tarixi</h2>
        </div>
        {history.length > 0 && (
          <span className="text-xs text-gray-600">{history.length} ta</span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-gray-600">Hali SMS yuborilmagan</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {history.map((s) => {
            const st = STATUS[s.status] || STATUS.pending;
            return (
              <li key={s.id} className="bg-gray-800/50 border border-gray-800 hover:border-gray-700 rounded-xl p-3.5 space-y-2 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${st.cls}`}>
                    {st.label}
                  </span>
                  <span className="text-xs text-gray-600 flex-shrink-0">{timeAgo(s.created_at)}</span>
                </div>

                <p className="text-sm text-gray-200 leading-relaxed line-clamp-2">{s.message}</p>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {s.phone_numbers?.slice(0, 3).map((p) => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded-lg bg-gray-700/60 text-gray-400 font-mono">
                      {p}
                    </span>
                  ))}
                  {s.phone_numbers?.length > 3 && (
                    <span className="text-xs text-gray-600">+{s.phone_numbers.length - 3} ta</span>
                  )}
                </div>

                {s.device_name && (
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {s.device_name}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
