import React from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';

export default function StatusStrip() {
  const { activeRunway, safeToSpend, syncLatency, confidenceScore, recalibrateLedger } = useFinancial();
  const { currentUser } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="w-full px-space-xl py-3 flex flex-wrap items-center justify-between gap-3"
      style={{ borderBottom: '1px solid #d9c9b0', background: 'rgba(247,240,230,0.6)' }}>

      {/* Left — greeting */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2.5">
          <span className="font-headline-sm text-headline-sm font-semibold" style={{ color: '#2c1f0e' }}>
            {greeting}, {firstName} ✦
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(90,110,58,0.12)', color: '#5a6e3a', border: '1px solid rgba(90,110,58,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#5a6e3a' }} />
            Live Orchestration
          </span>
        </div>
        <p className="font-body-sm flex items-center gap-2" style={{ color: '#6b4f35' }}>
          <span>3 verified accounts</span>
          <span style={{ color: '#c9b49a' }}>·</span>
          <span>Runway: <strong className="font-label-md" style={{ color: '#2c1f0e' }}>{activeRunway}</strong></span>
          <span style={{ color: '#c9b49a' }}>·</span>
          <span>Safe to spend: <strong className="font-label-md" style={{ color: '#5a6e3a' }}>₹{safeToSpend.toLocaleString('en-IN')}</strong></span>
        </p>
      </div>

      {/* Right — telemetry chips */}
      <div className="flex items-center gap-2">
        {[
          { label: 'Latency',    value: syncLatency,     color: '#5a6e3a' },
          { label: 'Confidence', value: confidenceScore, color: '#7c4a1e' },
        ].map(({ label, value, color }) => (
          <div key={label}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: '#fffdf9', border: '1px solid #d9c9b0', boxShadow: '0 1px 4px rgba(100,60,20,0.07)' }}>
            <span className="font-label-sm uppercase tracking-wider" style={{ color: '#a0846a', fontSize: '0.6rem' }}>{label}</span>
            <span className="font-label-md font-semibold" style={{ color }}>{value}</span>
          </div>
        ))}

        <button
          onClick={recalibrateLedger}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label-sm font-semibold transition-all"
          style={{ background: '#7c4a1e', color: '#f3dcc0', boxShadow: '0 2px 8px rgba(124,74,30,0.25)' }}
          onMouseEnter={e => e.currentTarget.style.background = '#a0632e'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c4a1e'}
        >
          <span className="material-symbols-outlined text-[15px]">sync</span>
          Recalibrate
        </button>
      </div>
    </div>
  );
}
