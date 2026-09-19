import React from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function AnalyticalDecisionCard() {
  const { decisionData, openModal } = useFinancial();

  const isApproved = decisionData.verdict.includes('APPROVED') || decisionData.verdict.includes('OPTIMIZED');
  const isRejected = decisionData.verdict.includes('REJECTED');

  const verdictStyle = isApproved
    ? { bg: '#deedc8', text: '#1a2900', border: '#c4db9e', dot: '#5a6e3a' }
    : isRejected
    ? { bg: '#f5d5d5', text: '#5c0e0e', border: '#f0b8b8', dot: '#9b2c2c' }
    : { bg: '#faecd3', text: '#3d2800', border: '#f0d5a8', dot: '#9e6c2a' };

  const metricTiles = [
    { label: 'Pre-Purchase Liquid', value: decisionData.liquidBefore, icon: 'account_balance_wallet' },
    { label: 'Direct Math',         value: decisionData.calculation,  icon: 'calculate'              },
    { label: 'Post-Purchase Margin',value: decisionData.liquidAfter,  icon: 'savings',
      valueColor: isApproved ? '#3d5420' : isRejected ? '#9b2c2c' : '#3d2800' },
  ];

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 animate-float-up"
      style={{
        background: '#fdf8f2',
        border: '1px solid #d9c9b0',
        boxShadow: '0 2px 10px rgba(100,60,20,0.06)',
        animationDelay: '120ms',
      }}>

      {/* Verdict badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-label-sm font-semibold uppercase tracking-widest"
          style={{ color: '#a0846a', fontSize: '0.6rem' }}>Synthesis Summary</span>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ background: verdictStyle.bg, border: `1px solid ${verdictStyle.border}` }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: verdictStyle.dot }} />
          <span className="font-label-md font-bold" style={{ color: verdictStyle.text, fontSize: '0.68rem' }}>
            {decisionData.verdict}
          </span>
        </div>
      </div>

      {/* 3 metric tiles */}
      <div className="grid grid-cols-3 gap-2">
        {metricTiles.map(t => (
          <div key={t.label} className="rounded-xl p-2.5 flex flex-col gap-1"
            style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: '#f3dcc0' }}>
              <span className="material-symbols-outlined text-[13px]" style={{ color: '#7c4a1e' }}>{t.icon}</span>
            </div>
            <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.label}
            </span>
            <span className="font-label-md font-bold leading-tight" style={{ color: t.valueColor ?? '#2c1f0e', fontSize: '0.75rem' }}>
              {t.value}
            </span>
          </div>
        ))}
      </div>

      {/* Checkpoint note */}
      <div className="flex items-start gap-2.5 rounded-xl p-3"
        style={{ background: verdictStyle.bg, border: `1px solid ${verdictStyle.border}` }}>
        <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5"
          style={{ color: verdictStyle.dot }}>
          {isApproved ? 'check_circle' : isRejected ? 'warning' : 'info'}
        </span>
        <p className="font-body-sm leading-relaxed" style={{ color: verdictStyle.text }}>
          {decisionData.checkpoint}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap pt-0.5">
        <button
          onClick={() => openModal('simulatePurchase')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label-sm font-semibold transition-all"
          style={{ background: '#f7f0e6', color: '#6b4f35', border: '1px solid #d9c9b0' }}
          onMouseEnter={e => e.currentTarget.style.background = '#ede0d0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f7f0e6'}
        >
          <span className="material-symbols-outlined text-[14px]">science</span>
          Simulate Purchase
        </button>
        <button
          onClick={() => openModal('priceAlert')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label-sm font-semibold transition-all"
          style={{ background: '#7c4a1e', color: '#f3dcc0', boxShadow: '0 2px 8px rgba(124,74,30,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.background = '#a0632e'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c4a1e'}
        >
          <span className="material-symbols-outlined text-[14px]">notifications_active</span>
          Set Price Alert
        </button>
      </div>
    </div>
  );
}
