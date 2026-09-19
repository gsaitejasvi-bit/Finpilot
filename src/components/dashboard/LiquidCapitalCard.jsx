import React from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function LiquidCapitalCard() {
  const { liquidCapital, checkingBalance, safeToSpend, inflow, outflow } = useFinancial();

  const outflowPct   = Math.min(100, Math.round((outflow / inflow) * 1000) / 10);
  const surplus      = Math.max(0, inflow - outflow);
  const savingsRate  = Math.round(((inflow - outflow) / inflow) * 100);

  const metrics = [
    { label: 'Checking',     value: `₹${checkingBalance.toLocaleString('en-IN')}`, icon: 'account_balance_wallet', tint: '#f3dcc0' },
    { label: 'Safe to Spend',value: `₹${safeToSpend.toLocaleString('en-IN')}`,    icon: 'verified_user',           tint: '#deedc8' },
    { label: 'Monthly Inflow',value: `₹${inflow.toLocaleString('en-IN')}`,         icon: 'trending_up',             tint: '#faecd3' },
  ];

  return (
    <div className="widget p-space-lg flex flex-col gap-4 animate-float-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="font-label-sm uppercase tracking-widest font-semibold"
            style={{ color: '#a0846a', fontSize: '0.65rem' }}>Total Liquid Capital</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-metric-lg text-metric-lg font-semibold tracking-tight"
              style={{ color: '#2c1f0e', fontFamily: "'Playfair Display', serif", fontSize: '2rem' }}>
              ₹{liquidCapital.toLocaleString('en-IN')}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: '#deedc8', color: '#3d5420' }}>
              +4.2% MoM
            </span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#f3dcc0,#e8c99a)' }}>
          <span className="material-symbols-outlined text-[20px]" style={{ color: '#7c4a1e' }}>account_balance</span>
        </div>
      </div>

      {/* 3 mini metric tiles */}
      <div className="grid grid-cols-3 gap-2">
        {metrics.map(m => (
          <div key={m.label} className="rounded-xl p-2.5 flex flex-col gap-1"
            style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-0.5"
              style={{ background: m.tint }}>
              <span className="material-symbols-outlined text-[15px]" style={{ color: '#7c4a1e' }}>{m.icon}</span>
            </div>
            <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</span>
            <span className="font-label-md font-semibold leading-tight" style={{ color: '#2c1f0e' }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Inflow vs outflow bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between font-label-sm" style={{ color: '#6b4f35' }}>
          <span>Inflow ₹{inflow.toLocaleString('en-IN')}</span>
          <span>Outflow {outflowPct}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden progress-bar"
          style={{ background: '#ede0d0' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${outflowPct}%`, background: 'linear-gradient(90deg,#7c4a1e,#a0632e)' }} />
        </div>
        <div className="flex justify-between font-label-sm" style={{ color: '#a0846a' }}>
          <span>Surplus ₹{surplus.toLocaleString('en-IN')}</span>
          <span>Savings rate {savingsRate}%</span>
        </div>
      </div>

      {/* Sparkline row */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl"
        style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
        <div>
          <span className="font-label-sm block" style={{ color: '#a0846a', fontSize: '0.65rem' }}>7-Day Burn Rate</span>
          <span className="font-label-md font-semibold" style={{ color: '#2c1f0e' }}>₹1,410 / day avg</span>
        </div>
        <svg width="100" height="28" viewBox="0 0 100 28" fill="none">
          <path d="M0 22 L16 18 L33 23 L50 12 L66 16 L83 6 L100 10"
            stroke="#7c4a1e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="100" cy="10" r="3" fill="#7c4a1e" />
        </svg>
      </div>
    </div>
  );
}
