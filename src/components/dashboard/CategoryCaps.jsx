import React from 'react';
import { useFinancial } from '../../context/FinancialContext';

const CAT_ICONS = {
  'Food & Dining':     'restaurant',
  'Transportation':    'directions_car',
  'Shopping & Tech':   'shopping_bag',
  'Utilities & Bills': 'bolt',
};

export default function CategoryCaps() {
  const { categories } = useFinancial();

  const exceeded  = categories.filter(c => c.spent >= c.limit);
  const nearLimit = categories.filter(c => { const p = c.spent / c.limit * 100; return p >= 80 && p < 100; });

  return (
    <div className="widget p-space-lg flex flex-col gap-4 animate-float-up" style={{ animationDelay: '60ms' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#faecd3,#f0d5a8)' }}>
            <span className="material-symbols-outlined text-[17px]" style={{ color: '#9e6c2a' }}>bar_chart</span>
          </div>
          <span className="font-headline-sm font-semibold" style={{ color: '#2c1f0e' }}>Monthly Budgets</span>
        </div>
        <span className="font-label-sm px-2 py-1 rounded-full"
          style={{ background: '#f7f0e6', color: '#a0846a', border: '1px solid #d9c9b0', fontSize: '0.65rem' }}>
          Day 19 / 30
        </span>
      </div>

      {/* Alert banners */}
      {exceeded.length > 0 && (
        <div className="rounded-xl px-3 py-2.5 flex items-start gap-2.5"
          style={{ background: '#f5d5d5', border: '1px solid #f0b8b8' }}>
          <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: 17, color: '#9b2c2c' }}>error</span>
          <div className="flex flex-col gap-0.5">
            <span className="font-label-sm font-bold uppercase tracking-wider" style={{ color: '#9b2c2c', fontSize: '0.62rem' }}>
              Budget Exceeded
            </span>
            <span className="font-body-sm" style={{ color: '#5c0e0e', fontSize: '0.75rem' }}>
              {exceeded.map(c => c.name).join(', ')} {exceeded.length === 1 ? 'has' : 'have'} exceeded the monthly
              limit. Pause spending in {exceeded.length === 1 ? 'this category' : 'these categories'} immediately.
            </span>
          </div>
        </div>
      )}

      {nearLimit.length > 0 && exceeded.length === 0 && (
        <div className="rounded-xl px-3 py-2.5 flex items-start gap-2.5"
          style={{ background: '#faecd3', border: '1px solid #f0d5a8' }}>
          <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: 17, color: '#9e6c2a' }}>warning</span>
          <div className="flex flex-col gap-0.5">
            <span className="font-label-sm font-bold uppercase tracking-wider" style={{ color: '#9e6c2a', fontSize: '0.62rem' }}>
              Approaching Limit
            </span>
            <span className="font-body-sm" style={{ color: '#3d2800', fontSize: '0.75rem' }}>
              {nearLimit.map(c => `${c.name} (${Math.round(c.spent / c.limit * 100)}%)`).join(', ')} — slow down
              spending to stay within budget this cycle.
            </span>
          </div>
        </div>
      )}

      {/* Category rows */}
      <div className="flex flex-col gap-3">
        {categories.map(cat => {
          const pct       = Math.min(100, Math.round((cat.spent / cat.limit) * 100));
          const remaining = Math.max(0, cat.limit - cat.spent);
          const isOver    = pct >= 100;
          const isWarn    = pct >= 80 && !isOver;

          const barColor  = isOver ? '#9b2c2c' : isWarn ? '#9e6c2a' : '#5a6e3a';
          const badgeBg   = isOver ? '#f5d5d5' : isWarn ? '#faecd3' : '#deedc8';
          const badgeText = isOver ? '#5c0e0e' : isWarn ? '#3d2800' : '#1a2900';

          return (
            <div key={cat.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: badgeBg }}>
                    <span className="material-symbols-outlined text-[13px]" style={{ color: barColor }}>
                      {CAT_ICONS[cat.name] ?? 'category'}
                    </span>
                  </div>
                  <span className="font-body-md font-medium" style={{ color: '#2c1f0e' }}>{cat.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: badgeBg, color: badgeText }}>
                    {isOver ? '🚨 EXCEEDED' : `${pct}%`}
                  </span>
                </div>
                <span className="font-label-md font-semibold" style={{ color: '#2c1f0e' }}>
                  ₹{cat.spent.toLocaleString('en-IN')}
                  <span style={{ color: '#a0846a', fontWeight: 400 }}> / ₹{cat.limit.toLocaleString('en-IN')}</span>
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full overflow-hidden progress-bar" style={{ background: '#ede0d0' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: barColor }} />
              </div>

              <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.65rem' }}>
                {isOver
                  ? `Over by ₹${(cat.spent - cat.limit).toLocaleString('en-IN')} — budget exhausted`
                  : isWarn
                  ? `⚠️ Only ₹${remaining.toLocaleString('en-IN')} remaining`
                  : `₹${remaining.toLocaleString('en-IN')} remaining · Well calibrated`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
