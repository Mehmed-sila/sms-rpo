import { motion, AnimatePresence } from 'framer-motion';

export default function PhoneList({ phones, selected, onToggle, onGoSend, onGoCall, onClear }) {
  const allSelected = phones.length > 0 && selected.size === phones.length;

  function toggleAll() {
    if (allSelected) phones.forEach((p) => selected.has(p) && onToggle(p));
    else phones.forEach((p) => !selected.has(p) && onToggle(p));
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
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-white/90">Raqamlar</h2>
          {phones.length > 0 && (
            <motion.span
              key={phones.length}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass text-xs px-2.5 py-0.5 rounded-full text-white/50 font-semibold tabular-nums"
            >
              {phones.length}
            </motion.span>
          )}
        </div>
        {phones.length > 0 && (
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="text-xs text-white/40"
                >
                  <span className="text-white font-semibold">{selected.size}</span> tanlandi
                </motion.span>
              )}
            </AnimatePresence>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleAll}
              className="glass text-xs px-3 py-1.5 rounded-xl text-white/50 hover:text-white/80 transition-colors"
            >
              {allSelected ? 'Bekor' : 'Hammasi'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onClear}
              className="glass text-xs px-2 py-1.5 rounded-xl text-white/30 hover:text-red-400 transition-colors"
              title="Ro'yxatni tozalash"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </motion.button>
          </div>
        )}
      </div>

      <div className="border-t border-white/5" />

      {phones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
            <svg className="w-7 h-7 text-white/15" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <p className="text-xs text-white/25 text-center leading-relaxed">
            Raqamlar yo'q<br/>
            <span className="text-white/15">URL yoki qo'lda kiriting</span>
          </p>
        </div>
      ) : (
        <ul className="space-y-1 max-h-72 overflow-y-auto custom-scroll">
          <AnimatePresence initial={false}>
            {phones.map((phone, i) => {
              const isSelected = selected.has(phone);
              return (
                <motion.li
                  key={phone}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12, height: 0 }}
                  transition={{ delay: Math.min(i * 0.015, 0.2), type: 'spring', stiffness: 400, damping: 30 }}
                  onClick={() => onToggle(phone)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer select-none transition-colors duration-150 ${
                    isSelected ? 'bg-white/14 border border-white/18' : 'bg-white/4 border border-transparent hover:bg-white/7'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isSelected ? 'bg-white' : 'border-2 border-white/20'
                  }`}>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.svg
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          className="w-3 h-3 text-black"
                          fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className={`text-sm font-mono tracking-wider flex-1 transition-colors ${isSelected ? 'text-white' : 'text-white/50'}`}>
                    {phone}
                  </span>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="w-1.5 h-1.5 rounded-full bg-white/50"
                      />
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex gap-2"
          >
            {/* SMS */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onGoSend}
              className="glass-btn-primary flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              SMS ({selected.size})
            </motion.button>
            {/* Qo'ng'iroq */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onGoCall}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: 'rgba(167,139,250,0.18)', border: '1px solid rgba(167,139,250,0.35)', color: '#c4b5fd' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Qo'ng'iroq ({selected.size})
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
