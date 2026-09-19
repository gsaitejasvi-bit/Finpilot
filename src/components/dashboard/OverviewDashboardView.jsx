import React from 'react';
import { useFinancial } from '../../context/FinancialContext';
import StatusStrip from './StatusStrip';
import ReasoningCore from './ReasoningCore';
import AnalyticalDecisionCard from './AnalyticalDecisionCard';
import NaturalExpenseLogger from './NaturalExpenseLogger';
import LiquidCapitalCard from './LiquidCapitalCard';
import CategoryCaps from './CategoryCaps';
import SinkingFunds from './SinkingFunds';
import TransactionTimeline from './TransactionTimeline';
import PatternNoteCard from './PatternNoteCard';
import BudgetAlertCard from './BudgetAlertCard';

/* ── Small floating KPI ribbon tile ─────────────────────────────── */
function KPITile({ label, display, sub, icon, grad, iconColor, delay }) {
  return (
    <div
      className="animate-float-up rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 cursor-default"
      style={{
        background: '#fffdf9',
        border: '1px solid #d9c9b0',
        boxShadow: '0 4px 24px rgba(100,60,20,0.09)',
        animationDelay: delay,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(100,60,20,0.14)';
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(100,60,20,0.09)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon blob */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `linear-gradient(135deg,${grad[0]},${grad[1]})` }}
      >
        <span className="material-symbols-outlined text-[22px]" style={{ color: iconColor }}>
          {icon}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="font-label-sm uppercase tracking-widest"
          style={{ color: '#a0846a', fontSize: '0.6rem' }}
        >
          {label}
        </span>
        <span
          className="font-bold leading-tight truncate"
          style={{ color: '#2c1f0e', fontFamily: "'Playfair Display',serif", fontSize: '1.15rem' }}
        >
          {display}
        </span>
        <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.62rem' }}>
          {sub}
        </span>
      </div>
    </div>
  );
}

/* ── Main dashboard view ─────────────────────────────────────────── */
export default function OverviewDashboardView() {
  const { safeToSpend, inflow, goals } = useFinancial();

  const fullyFunded = goals.filter(g => g.percentage >= 100).length;

  const kpiTiles = [
    {
      label:     'Safe to Spend',
      display:   `₹${safeToSpend.toLocaleString('en-IN')}`,
      sub:       'after emergency floor',
      icon:      'verified_user',
      grad:      ['#f3dcc0', '#e8c99a'],
      iconColor: '#7c4a1e',
      delay:     '0ms',
    },
    {
      label:     'Monthly Inflow',
      display:   `₹${inflow.toLocaleString('en-IN')}`,
      sub:       'verified salary deposit',
      icon:      'trending_up',
      grad:      ['#deedc8', '#c4db9e'],
      iconColor: '#5a6e3a',
      delay:     '60ms',
    },
    {
      label:     'Active Goals',
      display:   `${goals.length} Goals`,
      sub:       `${fullyFunded} fully funded`,
      icon:      'flag',
      grad:      ['#faecd3', '#f0d5a8'],
      iconColor: '#9e6c2a',
      delay:     '120ms',
    },
  ];

  return (
    <div className="flex flex-col w-full min-w-0" style={{ background: '#fdf8f2', minHeight: '100vh' }}>

      {/* ── Status strip ──────────────────────────────────────── */}
      <StatusStrip />

      {/* ── Page canvas ───────────────────────────────────────── */}
      <div className="w-full px-8 py-6 flex flex-col gap-6">

        {/* ROW 0 — Budget alert cards (only shown when limits exceeded/near) */}
        <BudgetAlertCard />

        {/* ROW 1 — KPI ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpiTiles.map(tile => (
            <KPITile key={tile.label} {...tile} />
          ))}
        </div>

        {/* ROW 2 — main two-column workstation */}
        <div className="grid grid-cols-12 gap-5 items-start">

          {/* LEFT: intelligence engine — 7 cols */}
          <div className="col-span-12 xl:col-span-7 flex flex-col gap-5">
            <ReasoningCore />
            <AnalyticalDecisionCard />
            <NaturalExpenseLogger />
          </div>

          {/* RIGHT: financial reality — 5 cols */}
          <div className="col-span-12 xl:col-span-5 flex flex-col gap-5">
            <LiquidCapitalCard />
            <CategoryCaps />
            <SinkingFunds />
          </div>
        </div>

        {/* ROW 3 — transaction timeline + pattern insight */}
        <div className="grid grid-cols-12 gap-5 items-start">
          <div className="col-span-12 xl:col-span-8">
            <TransactionTimeline />
          </div>
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-5">
            <PatternNoteCard />

            {/* Floating decorative "quick actions" tile */}
            <QuickActionsWidget />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Bonus floating quick-actions widget ────────────────────────── */
function QuickActionsWidget() {
  const { openModal, setActiveTab } = useFinancial();

  const actions = [
    { label: 'Add Transaction', icon: 'add_circle',       onClick: () => openModal('addTx'),        grad: ['#f3dcc0','#e8c99a'], color: '#7c4a1e' },
    { label: 'New Goal',        icon: 'flag',             onClick: () => openModal('createGoal'),    grad: ['#deedc8','#c4db9e'], color: '#5a6e3a' },
    { label: 'Market Research', icon: 'candlestick_chart',onClick: () => setActiveTab('analytics'),  grad: ['#faecd3','#f0d5a8'], color: '#9e6c2a' },
    { label: 'Monte Carlo',     icon: 'query_stats',      onClick: () => openModal('monteCarlo'),    grad: ['#e8ddd0','#d9c9b0'], color: '#6b4f35' },
  ];

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 animate-float-up"
      style={{
        background: '#fffdf9',
        border: '1px solid #d9c9b0',
        boxShadow: '0 4px 24px rgba(100,60,20,0.09)',
        animationDelay: '240ms',
      }}
    >
      <span
        className="font-label-sm uppercase tracking-widest font-semibold"
        style={{ color: '#a0846a', fontSize: '0.6rem' }}
      >
        Quick Actions
      </span>

      <div className="grid grid-cols-2 gap-2">
        {actions.map(a => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
            style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `linear-gradient(135deg,${a.grad[0]},${a.grad[1]})`;
              e.currentTarget.style.borderColor = a.grad[1];
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f7f0e6';
              e.currentTarget.style.borderColor = '#d9c9b0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg,${a.grad[0]},${a.grad[1]})` }}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ color: a.color }}>
                {a.icon}
              </span>
            </div>
            <span className="font-label-sm font-medium text-center" style={{ color: '#2c1f0e', fontSize: '0.67rem' }}>
              {a.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
