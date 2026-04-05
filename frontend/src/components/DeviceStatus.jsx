import { useEffect, useState } from 'react';
import { getDevices } from '../api';

export default function DeviceStatus() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    getDevices().then((r) => setDevices(r.data));
    const interval = setInterval(() => {
      getDevices().then((r) => setDevices(r.data));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = devices.filter((d) => d.status === 'online').length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Qurilmalar</h2>
        </div>
        {devices.length > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            onlineCount > 0
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-gray-800 text-gray-500 border border-gray-700'
          }`}>
            {onlineCount}/{devices.length} online
          </span>
        )}
      </div>

      {devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-gray-600">Hech qanday qurilma ulanmagan</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {devices.map((d) => (
            <li key={d.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
              d.status === 'online' ? 'bg-gray-800/60 border border-gray-700/50' : 'bg-gray-800/30 border border-gray-800'
            }`}>
              <span className="relative flex h-2 w-2 flex-shrink-0">
                {d.status === 'online' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  d.status === 'online' ? 'bg-emerald-400' : 'bg-gray-600'
                }`} />
              </span>
              <span className={`text-sm flex-1 truncate ${d.status === 'online' ? 'text-gray-200' : 'text-gray-500'}`}>
                {d.device_name || 'Nomsiz qurilma'}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${
                d.platform === 'android'
                  ? 'text-sky-400 bg-sky-500/10'
                  : 'text-violet-400 bg-violet-500/10'
              }`}>
                {d.platform}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
