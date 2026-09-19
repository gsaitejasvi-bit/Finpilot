import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

const GOAL_ICONS  = ['flag','beach_access','laptop_mac','savings','flight','home','favorite','school'];
const GOAL_GRADS  = [
  ['#f3dcc0','#e8c99a'],
  ['#deedc8','#c4db9e'],
  ['#faecd3','#f0d5a8'],
  ['#e8ddd0','#d9c9b0'],
  ['#f3dcc0','#d9c9b0'],
];

function MilestoneBadge({ pct }) {
  if (pct >= 100) return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background:'#deedc8', color:'#1a2900', border:'1px solid #c4db9e' }}>🎉 FUNDED</span>;
  if (pct >= 75)  return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background:'#f3dcc0', color:'#3b1e08', border:'1px solid #e8c99a' }}>🔷 75%</span>;
  if (pct >= 50)  return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background:'#faecd3', color:'#3d2800', border:'1px solid #f0d5a8' }}>🔸 50%</span>;
  return null;
}

export default function SinkingFunds() {
  const { goals, openModal, topUpGoal, inflow, outflow } = useFinancial();
  const [expanded, setExpanded] = useState(null);

  const surplus = Math.max(0, inflow - outflow);

  return (
    <div className="widget p-space-lg flex flex-col gap-4 animate-float-up" style={{ animationDelay: '120ms' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f3dcc0,#e8c99a)' }}>
            <span className="material-symbols-outlined text-[17px]" style={{ color: '#7c4a1e' }}>flag</span>
          </div>
          <div>
            <span className="font-headline-sm font-semibold block" style={{ color: '#2c1f0e' }}>Sinking Funds</span>
            <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.6rem' }}>
              {goals.filter(g => g.percentage >= 100).length} funded · {goals.length} total
            </span>
          </div>
        </div>
        <button
          onClick={() => openModal('createGoal')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm font-semibold transition-all"
          style={{ background: '#7c4a1e', color: '#f3dcc0', fontSize: '0.7rem' }}
          onMouseEnter={e => e.currentTarget.style.background = '#a0632e'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c4a1e'}>
          <span className="material-symbols-outlined text-[13px]">add</span>
          New Goal
        </button>
      </div>

      {/* Goal cards */}
      <div className="flex flex-col gap-3">
        {goals.map((goal, idx) => {
          const grad    = GOAL_GRADS[idx % GOAL_GRADS.length];
          const icon    = GOAL_ICONS[idx % GOAL_ICONS.length];
          const pct     = Math.min(100, goal.percentage);
          const rem     = Math.max(0, goal.target - goal.current);
          const mo20    = surplus > 0 ? Math.ceil(rem / (surplus * 0.20)) : null;
          const mo30    = surplus > 0 ? Math.ceil(rem / (surplus * 0.30)) : null;
          const isOpen  = expanded === goal.id;
          const isFunded = pct >= 100;

          return (
            <div key={goal.id} className="rounded-xl overflow-hidden"
              style={{ background: '#f7f0e6', border: `1px solid ${isFunded ? '#c4db9e' : '#d9c9b0'}` }}>

              {/* Main row — click to expand */}
              <div className="p-3 flex flex-col gap-2 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : goal.id)}>

                {/* Title row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `linear-gradient(135deg,${grad[0]},${grad[1]})` }}>
                      <span className="material-symbols-outlined text-[14px]" style={{ color: '#7c4a1e' }}>{icon}</span>
                    </div>
                    <span className="font-body-md font-semibold" style={{ color: '#2c1f0e' }}>{goal.name}</span>
                    <MilestoneBadge pct={pct} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-md font-bold" style={{ color: '#7c4a1e' }}>{pct.toFixed(1)}%</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#a0846a' }}>
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative">
                  <div className="w-full h-2.5 rounded-full overflow-hidden progress-bar" style={{ background: '#ede0d0' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: isFunded ? '#5a6e3a' : `linear-gradient(90deg,${grad[1]},#7c4a1e)` }} />
                  </div>
                  {/* Milestone tick marks */}
                  {[25, 50, 75].map(m => (
                    <div key={m} className="absolute top-0 h-2.5 w-px"
                      style={{ left: `${m}%`, background: '#fffdf9', opacity: 0.7 }} />
                  ))}
                </div>

                {/* Amount row */}
                <div className="flex items-center justify-between">
                  <span className="font-label-sm" style={{ color: '#6b4f35', fontSize: '0.7rem' }}>
                    ₹{goal.current.toLocaleString('en-IN')}
                    <span style={{ color: '#a0846a' }}> / ₹{goal.target.toLocaleString('en-IN')}</span>
                  </span>
                  <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.65rem' }}>
                    {isFunded ? '🎉 Complete!' : goal.daysRemaining ? `~${goal.daysRemaining} days` : goal.monthsCovered ? `${goal.monthsCovered}mo reserve` : ''}
                  </span>
                </div>
              </div>

              {/* Expanded: shortfall maths */}
              {isOpen && !isFunded && (
                <div className="px-3 pb-3 flex flex-col gap-2.5 animate-fade-in"
                  style={{ borderTop: '1px solid #d9c9b0' }}>
                  <span className="font-label-sm font-semibold pt-2 block"
                    style={{ color: '#a0846a', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Shortfall Analysis
                  </span>

                  {/* Shortfall tiles */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Shortfall',    value: `₹${rem.toLocaleString('en-IN')}`, color: '#7c4a1e' },
                      { label: '@ 20% surplus', value: mo20 ? `${mo20} mo` : '—', color: '#2c1f0e' },
                      { label: '@ 30% surplus', value: mo30 ? `${mo30} mo` : '—', color: '#2c1f0e' },
                    ].map(tile => (
                      <div key={tile.label} className="rounded-xl p-2 flex flex-col gap-0.5"
                        style={{ background: '#fffdf9', border: '1px solid #d9c9b0' }}>
                        <span style={{ color: '#a0846a', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {tile.label}
                        </span>
                        <span className="font-semibold" style={{ color: tile.color, fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
                          {tile.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Monthly breakdown */}
                  {surplus > 0 && (
                    <div className="rounded-xl px-3 py-2" style={{ background: '#deedc8', border: '1px solid #c4db9e' }}>
                      <span className="font-body-sm" style={{ color: '#1a2900', fontSize: '0.72rem' }}>
                        💡 Transfer <strong>₹{Math.ceil(rem / Math.max(1, mo20)).toLocaleString('en-IN')}/mo</strong> on
                        payday to fund this in <strong>{mo20} months</strong>.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Top-up + contribute buttons */}
              <div className="flex gap-2 px-3 pb-3">
                <button
                  onClick={() => topUpGoal(goal.id, 1000)}
                  className="flex-1 py-1.5 rounded-lg font-label-sm font-semibold transition-all"
                  style={{ background: '#ede0d0', color: '#6b4f35', border: '1px solid #d9c9b0', fontSize: '0.7rem' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#d9c9b0'; e.currentTarget.style.color = '#2c1f0e'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ede0d0'; e.currentTarget.style.color = '#6b4f35'; }}>
                  + ₹1,000
                </button>
                <button
                  onClick={() => topUpGoal(goal.id, 5000)}
                  className="flex-1 py-1.5 rounded-lg font-label-sm font-semibold transition-all"
                  style={{ background: '#f3dcc0', color: '#7c4a1e', border: '1px solid #e8c99a', fontSize: '0.7rem' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e8c99a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f3dcc0'; }}>
                  + ₹5,000
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
