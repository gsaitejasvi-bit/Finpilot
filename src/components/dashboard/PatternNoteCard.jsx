import React from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function PatternNoteCard() {
  const { openModal } = useFinancial();

  return (
    <div className="widget p-space-lg flex flex-col gap-4 animate-float-up" style={{ animationDelay: '180ms' }}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center animate-bob"
          style={{ background: 'linear-gradient(135deg,#faecd3,#f0d5a8)' }}>
          <span className="material-symbols-outlined text-[17px]" style={{ color: '#9e6c2a' }}>lightbulb</span>
        </div>
        <div>
          <span className="font-headline-sm font-semibold block" style={{ color: '#2c1f0e' }}>Pattern Note</span>
          <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.62rem' }}>DeepQuant-R4 · Next review in 4 days</span>
        </div>
      </div>

      {/* Insight card */}
      <div className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: 'linear-gradient(135deg,rgba(250,236,211,0.6),rgba(240,213,168,0.4))', border: '1px solid #e8c99a' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#9e6c2a' }} />
          <span className="font-label-sm font-semibold uppercase tracking-widest"
            style={{ color: '#9e6c2a', fontSize: '0.6rem' }}>Recurring Anomaly Detected</span>
        </div>
        <p className="font-body-md leading-relaxed" style={{ color: '#3d2800' }}>
          Weekend dining outlays have grown for{' '}
          <strong style={{ color: '#7c4a1e' }}>three consecutive months</strong>{' '}
          (+28% MoM). Shifting just 1 meal/wk to home cooking restores{' '}
          <strong style={{ color: '#5a6e3a' }}>₹2,400/month</strong>{' '}
          into your <em>Goa Trip Fund</em>.
        </p>

        {/* Stat pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'MoM Growth',    value: '+28%',    bg: '#f5d5d5', text: '#5c0e0e' },
            { label: 'Monthly Save',  value: '₹2,400',  bg: '#deedc8', text: '#1a2900' },
            { label: 'Goal Impact',   value: '+14 days', bg: '#faecd3', text: '#3d2800' },
          ].map(p => (
            <div key={p.label} className="px-2.5 py-1 rounded-full"
              style={{ background: p.bg, border: `1px solid ${p.bg}` }}>
              <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.6rem' }}>{p.label}: </span>
              <span className="font-label-md font-bold" style={{ color: p.text, fontSize: '0.7rem' }}>{p.value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => openModal('spendingShift')}
        className="w-full py-2.5 rounded-xl font-label-md font-semibold flex items-center justify-center gap-2 transition-all"
        style={{ background: '#7c4a1e', color: '#f3dcc0', boxShadow: '0 3px 12px rgba(124,74,30,0.25)' }}
        onMouseEnter={e => e.currentTarget.style.background = '#a0632e'}
        onMouseLeave={e => e.currentTarget.style.background = '#7c4a1e'}
      >
        <span className="material-symbols-outlined text-[16px]">trending_up</span>
        Explore Spending Shift
      </button>
    </div>
  );
}
