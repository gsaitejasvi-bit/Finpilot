import React, { useState, forwardRef } from 'react';
import { useFinancial } from '../../context/FinancialContext';

const NaturalExpenseLogger = forwardRef(function NaturalExpenseLogger(props, ref) {
  const { addQuickExpense } = useFinancial();
  const [inputText, setInputText] = useState('');

  const parseNLP = (text) => {
    const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
    const amount = amountMatch ? `₹${amountMatch[1]}` : '—';

    let cat = 'General Discretionary';
    if (/fuel|petrol|diesel|cab|uber|ola|metro/i.test(text))           cat = 'Transportation';
    else if (/coffee|food|lunch|dinner|swiggy|zomato|starbucks/i.test(text)) cat = 'Food & Dining';
    else if (/book|amazon|course|gadget|tech/i.test(text))             cat = 'Shopping & Tech';
    else if (/bill|rent|wifi|electricity/i.test(text))                 cat = 'Utilities & Bills';

    let date = 'Today';
    if (/yesterday/i.test(text))   date = 'Yesterday';
    if (/last night/i.test(text))  date = 'Last night';

    return { amount, cat, date };
  };

  const parsed = parseNLP(inputText);
  const hasInput = inputText.trim().length > 0;

  const handleConfirm = () => {
    if (!inputText.trim()) return;
    addQuickExpense(inputText);
    setInputText('');
  };

  return (
    <div className="widget p-space-lg flex flex-col gap-3 animate-float-up" style={{ animationDelay: '180ms' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#deedc8,#c4db9e)' }}>
            <span className="material-symbols-outlined text-[17px]" style={{ color: '#5a6e3a' }}>bolt</span>
          </div>
          <div>
            <span className="font-headline-sm font-semibold block" style={{ color: '#2c1f0e' }}>Quick Expense Logger</span>
            <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.62rem' }}>NLP · Real-time parser</span>
          </div>
        </div>
        {hasInput && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold animate-fade-in"
            style={{ background: '#deedc8', color: '#3d5420', border: '1px solid #c4db9e' }}>
            Auto-categorised
          </span>
        )}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all"
          style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = '#7c4a1e'}
          onBlurCapture={e  => e.currentTarget.style.borderColor = '#d9c9b0'}
        >
          <span className="material-symbols-outlined text-[16px] shrink-0" style={{ color: '#a0846a' }}>edit_note</span>
          <input
            ref={ref}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            placeholder="e.g. Paid ₹120 for coffee at Blue Tokai…"
            className="flex-1 bg-transparent font-body-md outline-none placeholder:opacity-50"
            style={{ color: '#2c1f0e' }}
          />
        </div>
        <button
          onClick={handleConfirm}
          disabled={!hasInput}
          className="px-4 py-2.5 rounded-xl font-label-md font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
          style={{ background: '#5a6e3a', color: '#fffdf9', boxShadow: '0 2px 8px rgba(90,110,58,0.25)' }}
          onMouseEnter={e => { if (hasInput) e.currentTarget.style.background = '#6e8a46'; }}
          onMouseLeave={e => e.currentTarget.style.background = '#5a6e3a'}
        >
          <span className="material-symbols-outlined text-[15px]">done_all</span>
          Log
        </button>
      </div>

      {/* Parser preview */}
      {hasInput && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl animate-fade-in flex-wrap"
          style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#5a6e3a' }} />
          {[
            { label: 'Amount',   value: parsed.amount },
            { label: 'Category', value: parsed.cat    },
            { label: 'Date',     value: parsed.date   },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.65rem' }}>{label}:</span>
              <span className="font-label-md font-semibold" style={{ color: '#2c1f0e', fontSize: '0.72rem' }}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default NaturalExpenseLogger;
