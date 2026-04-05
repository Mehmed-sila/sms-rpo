export default function PhoneList({ phones, selected, onToggle, onGoSend }) {
  const allSelected = phones.length > 0 && selected.size === phones.length;

  function toggleAll() {
    if (allSelected) {
      phones.forEach((p) => selected.has(p) && onToggle(p));
    } else {
      phones.forEach((p) => !selected.has(p) && onToggle(p));
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Topilgan raqamlar</h2>
          {phones.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-medium">
              {phones.length}
            </span>
          )}
        </div>

        {phones.length > 0 && (
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                {selected.size} tanlandi
              </span>
            )}
            <button
              onClick={toggleAll}
              className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
            >
              {allSelected ? 'Bekor qilish' : 'Hammasini'}
            </button>
          </div>
        )}
      </div>

      {phones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="text-xs text-gray-600">URL kiriting va "Yuklash" bosing</p>
        </div>
      ) : (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1 custom-scroll">
          {phones.map((phone) => {
            const isSelected = selected.has(phone);
            return (
              <li
                key={phone}
                onClick={() => onToggle(phone)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-indigo-600/20 border border-indigo-500/30'
                    : 'bg-gray-800/60 border border-gray-800 hover:border-gray-700 hover:bg-gray-800'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected
                    ? 'bg-indigo-500 border border-indigo-400'
                    : 'border border-gray-600 bg-gray-700'
                }`}>
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-mono tracking-wide flex-1 ${isSelected ? 'text-indigo-200' : 'text-gray-300'}`}>
                  {phone}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {selected.size > 0 && (
        <button
          onClick={onGoSend}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold
            bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
            text-white shadow-lg shadow-indigo-500/20 transition-all"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
          {selected.size} ta raqamga SMS yuborish
        </button>
      )}
    </div>
  );
}
