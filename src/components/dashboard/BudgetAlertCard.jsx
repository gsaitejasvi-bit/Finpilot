import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function BudgetAlertCard() {
  const { categories, setActiveTab } = useFinancial();
  const [dismissed, setDismissed] = useState([]);

  const exceeded  = categories.filter(c => c.spent >= c.limit && !dismissed.includes(c.id));
  const nearLimit = categories.filter(c => {
    const p = c.spent / c.limit * 100;
    return p >= 80 && p < 100 && !dismissed.includes(c.id);
  });

  const alerts = [
    ...exceeded.map(c => ({ ...c, level: 'error' })),
    ...nearLimit.map(c => ({ ...c, level: 'warning' })),
  ];

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 animate-float-up">
      {alerts.map(cat => {
        const pct     = Math.min(100, Math.round(cat.spent / cat.limit * 100));
        const rem     = Math.max(0, cat.limit - cat.spent);
        const isError = cat.level === 'error';

        return (
          <div key={cat.id}
            className="rounded-2xl overflow-hidden"
            style={{
              background:  isError ? '#fff5f5' : '#fffbf0',
              border:      `1px solid ${isError ? '#f0b8b8' : '#f0d5a8'}`,
              boxShadow:   `0 4px 20px ${isError ? 'rgba(155,44,44,0.12)' : 'rgba(158,108,42,0.10)'}`,
            }}>

            {/* Coloured top stripe */}
            <div className="h-1" style={{ background: isError ? '#9b2c2c' : '#9e6c2a' }} />

            <div className="px-4 py-3 flex items-start gap-3">
              {/* Icon */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: isError ? '#f5d5d5' : '#faecd3' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: isError ? '#9b2c2c' : '#9e6c2a' }}>
                  {isError ? 'error' : 'warning'}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-label-sm font-bold uppercase tracking-wider"
                    style={{ color: isError ? '#9b2c2c' : '#9e6c2a', fontSize: '0.6rem' }}>
                    {isError ? '🚨 Budget Exceeded' : '⚠️ Budget Alert'}
                  </span>
                  <span className="font-label-md font-bold"
                    style={{ color: isError ? '#9b2c2c' : '#9e6c2a', fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }}>
                    {pct}%
                  </span>
                </div>

                <p className="font-body-sm" style={{ color: isError ? '#5c0e0e' : '#3d2800', fontSize: '0.78rem', lineHeight: 1.5 }}>
                  <strong>{cat.name}</strong>
                  {isError
                    ? ` has exceeded its ₹${cat.limit.toLocaleString('en-IN')} limit by ₹${(cat.spent - cat.limit).toLocaleString('en-IN')}. Pause spending in this category immediately.`
                    : ` is at ${pct}% of its ₹${cat.limit.toLocaleString('en-IN')} budget. Only ₹${rem.toLocaleString('en-IN')} remaining this cycle.`
                  }
                </p>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: isError ? '#f0b8b8' : '#f0d5a8' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, pct)}%`, background: isError ? '#9b2c2c' : '#9e6c2a' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#a0846a', fontSize: '0.62rem' }}>
                    Spent ₹{cat.spent.toLocaleString('en-IN')} of ₹{cat.limit.toLocaleString('en-IN')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('budgets')}
                      className="font-label-sm font-semibold transition-all"
                      style={{ color: isError ? '#9b2c2c' : '#9e6c2a', fontSize: '0.68rem', textDecoration: 'underline' }}>
                      View budgets
                    </button>
                    <button
                      onClick={() => setDismissed(prev => [...prev, cat.id])}
                      style={{ color: '#a0846a' }}
                      title="Dismiss">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
