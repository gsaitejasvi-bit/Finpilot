import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import MarketResearch from './MarketResearch';
import { SpendingBarChart, GoalProjectionChart } from './SpendingCharts';

/* ── SVG Pie chart ─────────────────────────────────────────────── */
const PIE_COLORS = ['#7c4a1e','#9e6c2a','#5a6e3a','#6b4f35','#a0846a'];

function PieChart({ slices }) {
  const total = slices.reduce((s, c) => s + c.value, 0);
  if (total === 0) return null;

  let cursor = 0;
  const R = 56, CX = 70, CY = 70;

  function polarToXY(angle, r) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  }

  function makeArc(start, end, r) {
    const s = polarToXY(start, r);
    const e = polarToXY(end,   r);
    const large = end - start > 180 ? 1 : 0;
    return `M ${CX} ${CY} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
  }

  const [hovered, setHovered] = useState(null);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={140} height={140} viewBox="0 0 140 140">
        {slices.map((slice, i) => {
          const deg   = (slice.value / total) * 360;
          const start = cursor;
          const end   = cursor + deg;
          cursor      = end;
          const isHov = hovered === i;
          return (
            <path
              key={i}
              d={makeArc(start, end, isHov ? R + 4 : R)}
              fill={PIE_COLORS[i % PIE_COLORS.length]}
              stroke="#fdf8f2"
              strokeWidth={2}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              opacity={hovered !== null && !isHov ? 0.65 : 1}
            />
          );
        })}
        {/* Centre hole */}
        <circle cx={CX} cy={CY} r={24} fill="#fdf8f2" />
        {/* Centre label */}
        {hovered !== null ? (
          <>
            <text x={CX} y={CY - 5} textAnchor="middle" style={{ fontSize: 9, fill: '#7c4a1e', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
              {Math.round(slices[hovered].value / total * 100)}%
            </text>
            <text x={CX} y={CY + 7} textAnchor="middle" style={{ fontSize: 7, fill: '#6b4f35', fontFamily: 'Geist, sans-serif' }}>
              {slices[hovered].label.split(' ')[0]}
            </text>
          </>
        ) : (
          <text x={CX} y={CY + 4} textAnchor="middle" style={{ fontSize: 8, fill: '#a0846a', fontFamily: 'Geist, sans-serif' }}>
            Spend
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {slices.map((s, i) => {
          const isHov = hovered === i;
          return (
            <div key={i}
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ opacity: hovered !== null && !isHov ? 0.55 : 1, transition: 'opacity 0.15s' }}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="font-body-sm truncate" style={{ color: '#2c1f0e', fontSize: '0.75rem' }}>{s.label}</span>
              <span className="ml-auto font-semibold shrink-0"
                style={{ color: '#7c4a1e', fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }}>
                ₹{s.value.toLocaleString('en-IN')}
              </span>
              <span className="shrink-0" style={{ color: '#a0846a', fontSize: '0.65rem' }}>
                {Math.round(s.value / total * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyticsView() {
  const { liquidCapital, categories, openModal, showToast } = useFinancial();
  const [timeframe, setTimeframe] = useState('30D');
  const [activePoint, setActivePoint] = useState('Today: ₹1,42,800 (+4.2%)');
  const [showMarket, setShowMarket] = useState(false);

  const dataNodes = [
    { cx: 100, cy: 105, info: "02 Sep: ₹1,37,050" },
    { cx: 200, cy: 95, info: "07 Sep: ₹1,38,100" },
    { cx: 300, cy: 102, info: "11 Sep: ₹1,37,850" },
    { cx: 400, cy: 80, info: "14 Sep: ₹1,39,900 (Salary Inflow)" },
    { cx: 500, cy: 68, info: "16 Sep: ₹1,41,200" },
    { cx: 600, cy: 42, info: "17 Sep: ₹1,42,150" },
    { cx: 700, cy: 24, info: "Today: ₹1,42,800 (+4.2%)" }
  ];

  return (
    <div className="flex flex-col w-full px-space-xl py-space-lg gap-space-lg max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-surface-container-highest pb-space-md">
        <div>
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
            Quantitative Dossier
          </span>
          <h1 className="font-headline-md text-headline-md text-on-surface font-semibold">
            Analytics & Asset Trajectory
          </h1>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            onClick={() => setShowMarket(v => !v)}
            className="px-3.5 py-2 rounded-lg font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-xs font-semibold"
            style={{ background: showMarket ? '#7c4a1e' : '#f7f0e6', color: showMarket ? '#f3dcc0' : '#6b4f35', border: '1px solid #d9c9b0' }}
          >
            <span className="material-symbols-outlined text-[16px]">candlestick_chart</span>
            <span>{showMarket ? 'Hide Market Research' : 'Market Research & IPOs'}</span>
          </button>
          <button 
            onClick={() => openModal('monteCarlo')}
            className="px-3.5 py-2 rounded-lg font-label-md text-label-md transition-colors flex items-center gap-1.5 shadow-xs font-semibold"
            style={{ background:'#7c4a1e', color:'#f3dcc0' }}
            onMouseEnter={e => e.currentTarget.style.background='#a0632e'}
            onMouseLeave={e => e.currentTarget.style.background='#7c4a1e'}
          >
            <span className="material-symbols-outlined text-[16px]">insights</span>
            <span>Monte Carlo Forecast</span>
          </button>
        </div>
      </div>

      {/* Market Research Panel */}
      {showMarket && (
        <div className="animate-float-up">
          <MarketResearch />
        </div>
      )}

      {/* Hero Statistician Card with Interactive SVG Chart */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl border border-surface-container-highest shadow-xs flex flex-col gap-space-md">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-space-md">
          <div className="space-y-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Aggregate Liquid & Staked Assets
            </span>
            <div className="flex items-baseline gap-space-sm flex-wrap">
              <span className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                ₹{liquidCapital.toLocaleString('en-IN')}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                +4.2% (₹5,750 this month)
              </span>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
              <span>Audited closing benchmark</span>
              <span>•</span>
              <span className="font-metric-md text-secondary font-semibold">
                Selected: {activePoint}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg border border-surface-container-highest">
            {['30D', '90D', '1Y', 'All'].map(tf => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  showToast(`Switched chart view to ${tf}`);
                }}
                className={`px-3 py-1 text-xs rounded font-semibold transition-colors ${
                  timeframe === tf
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* 30-Day Interactive Sparkline SVG */}
        <div className="my-space-md relative w-full h-48 bg-surface-container-low/30 rounded-lg p-2 border border-surface-container-highest">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 140">
            <defs>
              <linearGradient id="networth-grad-react" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#0037b0" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0037b0" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="20" x2="700" y2="20" stroke="#c4c5d7" strokeDasharray="3,3" strokeWidth="0.75" opacity="0.4" />
            <line x1="0" y1="70" x2="700" y2="70" stroke="#c4c5d7" strokeDasharray="3,3" strokeWidth="0.75" opacity="0.4" />
            <line x1="0" y1="120" x2="700" y2="120" stroke="#c4c5d7" strokeDasharray="3,3" strokeWidth="0.75" opacity="0.4" />

            {/* Filled Area */}
            <path 
              d="M 0,110 Q 50,115 100,105 T 200,95 T 300,102 T 400,80 T 500,68 T 600,42 T 700,24 L 700,140 L 0,140 Z" 
              fill="url(#networth-grad-react)" 
            />

            {/* Line */}
            <path 
              d="M 0,110 Q 50,115 100,105 T 200,95 T 300,102 T 400,80 T 500,68 T 600,42 T 700,24" 
              fill="none" 
              stroke="#0037b0" 
              strokeLinecap="round" 
              strokeWidth="2.5" 
            />

            {/* Data Interactive Anchor Nodes */}
            {dataNodes.map((node, i) => (
              <circle
                key={i}
                cx={node.cx}
                cy={node.cy}
                r={i === dataNodes.length - 1 ? 5.5 : 4.5}
                className="fill-surface-container-lowest stroke-primary stroke-2 cursor-pointer hover:r-7 transition-all"
                onMouseEnter={() => setActivePoint(node.info)}
                onClick={() => {
                  setActivePoint(node.info);
                  showToast(node.info);
                }}
              />
            ))}
          </svg>
        </div>

        <div className="flex items-center justify-between text-body-sm text-outline font-label-sm">
          <span>01 Sep (₹1,37,050)</span>
          <span>15 Sep Mid-Cycle Benchmark</span>
          <span className="text-primary font-semibold">18 Sep Today (₹1,42,800)</span>
        </div>
      </div>

      {/* Spending Breakdown Pie Chart */}
      <div className="widget p-6 flex flex-col gap-4 animate-float-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#f3dcc0,#e8c99a)' }}>
              <span className="material-symbols-outlined text-[17px]" style={{ color: '#7c4a1e' }}>donut_large</span>
            </div>
            <div>
              <span className="font-semibold block" style={{ color: '#2c1f0e', fontSize: '0.95rem' }}>
                Spending Breakdown
              </span>
              <span style={{ color: '#a0846a', fontSize: '0.62rem' }}>Current cycle · by category</span>
            </div>
          </div>
          <span className="font-label-sm px-2.5 py-1 rounded-full"
            style={{ background: '#f7f0e6', color: '#a0846a', border: '1px solid #d9c9b0', fontSize: '0.65rem' }}>
            Total: ₹{categories.reduce((a, c) => a + c.spent, 0).toLocaleString('en-IN')}
          </span>
        </div>

        <PieChart slices={categories.map(c => ({ label: c.name, value: c.spent }))} />

        {/* Bar table */}
        <div className="flex flex-col gap-2 mt-1">
          {[...categories].sort((a, b) => b.spent - a.spent).map((cat, i) => {
            const pct = cat.limit > 0 ? Math.min(100, Math.round(cat.spent / cat.limit * 100)) : 0;
            const isOver = pct >= 100;
            const isWarn = pct >= 80 && !isOver;
            const barColor = isOver ? '#9b2c2c' : isWarn ? '#9e6c2a' : PIE_COLORS[i % PIE_COLORS.length];
            return (
              <div key={cat.id} className="flex items-center gap-3">
                <span className="w-28 font-body-sm truncate shrink-0"
                  style={{ color: '#6b4f35', fontSize: '0.72rem' }}>{cat.name}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#ede0d0' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <span className="w-14 text-right font-label-sm shrink-0"
                  style={{ color: isOver ? '#9b2c2c' : '#2c1f0e', fontSize: '0.68rem', fontFamily: 'JetBrains Mono' }}>
                  {pct}%
                </span>
                <span className="w-20 text-right font-label-sm shrink-0"
                  style={{ color: '#7c4a1e', fontSize: '0.68rem', fontFamily: 'JetBrains Mono' }}>
                  ₹{cat.spent.toLocaleString('en-IN')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spending Over Time Bar Chart */}
      <SpendingBarChart />

      {/* Goal Projection Curve */}
      <GoalProjectionChart />

      {/* Asset Allocation & Holdings Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-container-highest shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md font-semibold text-on-surface">
                Liquid Checking & UPI
              </span>
              <span className="font-metric-md text-primary font-bold">34%</span>
            </div>
            <span className="font-metric-lg text-metric-lg font-bold text-on-surface mt-2 block">
              ₹48,750
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              Instant liquidity for operational obligations
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-primary h-full rounded-full" style={{ width: '34%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-container-highest shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md font-semibold text-on-surface">
                Dedicated Sinking Funds
              </span>
              <span className="font-metric-md text-secondary font-bold">42%</span>
            </div>
            <span className="font-metric-lg text-metric-lg font-bold text-on-surface mt-2 block">
              ₹60,050
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              Goa Trip + Tech Upgrade + Emergency reserve
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-secondary h-full rounded-full" style={{ width: '42%' }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-container-highest shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md font-semibold text-on-surface">
                Index SIP & Securities
              </span>
              <span className="font-metric-md text-tertiary font-bold">24%</span>
            </div>
            <span className="font-metric-lg text-metric-lg font-bold text-on-surface mt-2 block">
              ₹34,000
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
              Compounding at 12.2% annual CAGR
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-tertiary h-full rounded-full" style={{ width: '24%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
