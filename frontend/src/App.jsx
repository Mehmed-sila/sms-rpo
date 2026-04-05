import { useEffect, useState } from 'react';
import { useSocket } from './hooks/useSocket';

import WebhookPanel from './components/WebhookPanel';
import PhoneList from './components/PhoneList';
import SendSmsForm from './components/SendSmsForm';
import DeviceStatus from './components/DeviceStatus';
import SmsHistory from './components/SmsHistory';

const TABS = [
  {
    id: 'extract',
    label: 'Qidirish',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-indigo-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.2 : 1.8}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: 'phones',
    label: 'Raqamlar',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-violet-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
      </svg>
    ),
  },
  {
    id: 'send',
    label: 'Yuborish',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
      </svg>
    ),
  },
  {
    id: 'devices',
    label: 'Qurilmalar',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-sky-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Tarix',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-amber-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
  },
];

const TAB_ACCENT = {
  extract: 'bg-indigo-500/10 text-indigo-400',
  phones:  'bg-violet-500/10 text-violet-400',
  send:    'bg-emerald-500/10 text-emerald-400',
  devices: 'bg-sky-500/10 text-sky-400',
  history: 'bg-amber-500/10 text-amber-400',
};

export default function App() {
  const [tab, setTab] = useState('extract');
  const [phones, setPhones] = useState([]);
  const [selectedPhones, setSelectedPhones] = useState(new Set());
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const { connected, smsUpdate } = useSocket();

  useEffect(() => {
    if (!smsUpdate) return;
    setHistoryRefresh((n) => n + 1);
  }, [smsUpdate]);

  function handlePhones(newPhones) {
    setPhones(newPhones);
    setSelectedPhones(new Set());
    setTab('phones');
  }

  function togglePhone(phone) {
    setSelectedPhones((prev) => {
      const next = new Set(prev);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
  }

  const currentTab = TABS.find((t) => t.id === tab);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">SMS Dashboard</h1>
              <p className={`text-xs mt-0.5 font-medium ${TAB_ACCENT[tab]}`}>
                {currentTab?.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Phone count badge */}
            {phones.length > 0 && (
              <button
                onClick={() => setTab('phones')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-400 text-xs font-medium"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {phones.length}
                {selectedPhones.size > 0 && (
                  <span className="text-violet-300">· {selectedPhones.size} tanlandi</span>
                )}
              </button>
            )}

            {/* Connection */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-900 border border-gray-800">
              <span className="relative flex h-1.5 w-1.5">
                {connected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
              </span>
              <span className="text-xs text-gray-500 hidden sm:inline">
                {connected ? 'Ulangan' : 'Ulanmagan'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">
        {tab === 'extract' && (
          <WebhookPanel onPhones={handlePhones} />
        )}
        {tab === 'phones' && (
          <PhoneList
            phones={phones}
            selected={selectedPhones}
            onToggle={togglePhone}
            onGoSend={() => setTab('send')}
          />
        )}
        {tab === 'send' && (
          <SendSmsForm
            selected={selectedPhones}
            onSent={() => {
              setSelectedPhones(new Set());
              setHistoryRefresh((n) => n + 1);
              setTab('history');
            }}
          />
        )}
        {tab === 'devices' && <DeviceStatus />}
        {tab === 'history' && <SmsHistory refresh={historyRefresh} />}
      </main>

      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-gray-950/95 backdrop-blur border-t border-gray-800">
        <div className="max-w-lg mx-auto flex items-stretch">
          {TABS.map((t) => {
            const active = tab === t.id;
            const accent = {
              extract: active ? 'text-indigo-400' : '',
              phones:  active ? 'text-violet-400' : '',
              send:    active ? 'text-emerald-400' : '',
              devices: active ? 'text-sky-400' : '',
              history: active ? 'text-amber-400' : '',
            }[t.id];

            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative transition-all"
              >
                {/* Active indicator */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-current opacity-60" />
                )}

                {/* Badge for phones tab */}
                {t.id === 'phones' && selectedPhones.size > 0 && (
                  <span className="absolute top-2 right-1/2 translate-x-4 -translate-y-0 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {selectedPhones.size > 9 ? '9+' : selectedPhones.size}
                  </span>
                )}

                <span className={accent}>{t.icon(active)}</span>
                <span className={`text-[10px] font-medium leading-none ${active ? accent : 'text-gray-600'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* iPhone home indicator space */}
        <div className="h-safe-bottom bg-transparent" style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </div>
  );
}
