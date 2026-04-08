import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from './hooks/useSocket';

import WebhookPanel from './components/WebhookPanel';
import PhoneList from './components/PhoneList';
import SendSmsForm from './components/SendSmsForm';
import SendCallForm from './components/SendCallForm';
import SmsHistory from './components/SmsHistory';
import Stats from './components/Stats';

const TABS = [
  {
    id: 'extract',
    label: 'Qidirish',
    icon: (active) => (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'phones',
    label: 'Raqamlar',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    id: 'send',
    label: 'SMS',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    id: 'call',
    label: 'Qo\'ng\'iroq',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Tarix',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Statistika',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const tabVariants = {
  enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 32 } },
  exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0, transition: { duration: 0.18 } }),
};

export default function App() {
  const [tab, setTab] = useState('extract');
  const [prevTab, setPrevTab] = useState('extract');
  const [phones, setPhones] = useState([]);
  const [selectedPhones, setSelectedPhones] = useState(new Set());
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const tabOrder = TABS.map(t => t.id);
  const direction = tabOrder.indexOf(tab) > tabOrder.indexOf(prevTab) ? 1 : -1;

  const { connected, smsUpdate } = useSocket();

  useEffect(() => {
    if (!smsUpdate) return;
    setHistoryRefresh((n) => n + 1);
  }, [smsUpdate]);

  function handlePhones(newPhones) {
    setPhones(newPhones);
    setSelectedPhones(new Set());
    goTab('phones');
  }

  function goTab(id) {
    setPrevTab(tab);
    setTab(id);
  }

  function togglePhone(phone) {
    setSelectedPhones((prev) => {
      const next = new Set(prev);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
  }

  return (
    <div className="h-screen h-dvh bg-black flex justify-center overflow-hidden">
      <div className="relative w-full max-w-[430px] h-full flex flex-col text-white overflow-hidden">

        {/* Fon */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url('/bg.jpg')`, filter: 'brightness(0.38) saturate(1.3)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(160deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.82) 100%)' }} />

        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-20 px-4 pt-3 pb-2 flex-shrink-0"
        >
          <div className="glass-dark rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-white tracking-tight">SMS Dashboard</p>
            </div>

            <div className="flex items-center gap-2.5">
              {phones.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => goTab('phones')}
                  className="glass rounded-full px-3 py-1 flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span className="text-xs text-white/80 font-semibold tabular-nums">{phones.length}</span>
                  {selectedPhones.size > 0 && (
                    <span className="text-xs text-white/40">· {selectedPhones.size}</span>
                  )}
                </motion.button>
              )}

              <div className="flex items-center gap-1.5 glass rounded-full px-2.5 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
                </span>
                <span className={`text-xs font-medium ${connected ? 'text-green-300' : 'text-red-400'}`}>
                  {connected ? 'Ulangan' : 'Uzilgan'}
                </span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content */}
        <main className="relative z-10 flex-1 overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={tab}
              custom={direction}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 overflow-y-auto custom-scroll px-4 py-3 pb-4"
            >
              {tab === 'extract' && <WebhookPanel onPhones={handlePhones} />}
              {tab === 'phones' && (
                <PhoneList
                  phones={phones}
                  selected={selectedPhones}
                  onToggle={togglePhone}
                  onGoSend={() => goTab('send')}
                />
              )}
              {tab === 'send' && (
                <SendSmsForm
                  selected={selectedPhones}
                  onSent={() => {
                    setSelectedPhones(new Set());
                    setHistoryRefresh((n) => n + 1);
                    goTab('history');
                  }}
                />
              )}
              {tab === 'call' && (
                <SendCallForm
                  selected={selectedPhones}
                  connected={connected}
                  onSent={() => {
                    setSelectedPhones(new Set());
                    goTab('history');
                  }}
                />
              )}
              {tab === 'history' && <SmsHistory refresh={historyRefresh} />}
              {tab === 'stats' && <Stats />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navbar */}
        <motion.nav
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
          className="relative z-20 px-4 pb-4 pt-1 flex-shrink-0"
        >
          <div className="glass-dark rounded-3xl px-1.5 py-1.5 flex items-center relative">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <motion.button
                  key={t.id}
                  onClick={() => goTab(t.id)}
                  whileTap={{ scale: 0.88 }}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative"
                >
                  {active && (
                    <motion.div
                      layoutId="navPill"
                      className="absolute inset-x-1 inset-y-0 rounded-2xl tab-active-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}

                  {t.id === 'phones' && selectedPhones.size > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute top-0 right-1.5 w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center z-10"
                    >
                      {selectedPhones.size > 9 ? '9+' : selectedPhones.size}
                    </motion.span>
                  )}

                  <motion.span
                    className={`relative transition-colors duration-200 ${active ? 'text-white' : 'text-white/35'}`}
                    animate={{ y: active ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  >
                    {t.icon(active)}
                  </motion.span>
                  <span className={`relative text-[10px] font-semibold transition-colors duration-200 ${active ? 'text-white' : 'text-white/30'}`}>
                    {t.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.nav>

      </div>
    </div>
  );
}
