import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function NotificationsView() {
  const {
    notificationsEnabled, setNotificationsEnabled,
    notificationEmail,    setNotificationEmail,
    notifPermission,      enableNotifications,
    categories, goals, recurringTransactions,
    showToast,
  } = useFinancial();

  const [emailSaved, setEmailSaved] = useState(false);

  const permBadge = {
    granted:     { label: 'Granted',       bg: '#deedc8', color: '#3d5420' },
    denied:      { label: 'Denied',        bg: '#f5d5d5', color: '#9b2c2c' },
    default:     { label: 'Not Requested', bg: '#faecd3', color: '#7c4a1e' },
    unsupported: { label: 'Not Supported', bg: '#f7f0e6', color: '#a0846a' },
  }[notifPermission] || { label: 'Unknown', bg: '#f7f0e6', color: '#a0846a' };

  // Active alerts simulation
  const budgetAlerts = categories.filter(c => c.limit > 0 && (c.spent / c.limit) >= 0.8)
    .map(c => ({ type: 'budget', label: `${c.name} at ${Math.round(c.spent / c.limit * 100)}%`, severity: c.spent >= c.limit ? 'error' : 'warning', time: 'Just now' }));

  const goalAlerts = goals.filter(g => g.percentage >= 50)
    .map(g => ({ type: 'goal', label: `${g.name} reached ${g.percentage.toFixed(0)}%`, severity: 'success', time: 'Today' }));

  const recAlerts = recurringTransactions
    .filter(r => { if (!r.nextDue || r.status === 'paused') return false; const diff = (new Date(r.nextDue) - new Date()) / 86400000; return diff <= 3; })
    .map(r => ({ type: 'recurring', label: `${r.title} due soon`, severity: 'info', time: 'Upcoming' }));

  const allAlerts = [...budgetAlerts, ...goalAlerts, ...recAlerts];

  const severityStyle = {
    error:   { bg: '#f5d5d5', color: '#9b2c2c', border: '#f0b8b8', icon: 'error' },
    warning: { bg: '#faecd3', color: '#9e6c2a', border: '#e8c99a', icon: 'warning' },
    success: { bg: '#deedc8', color: '#3d5420', border: '#c4db9e', icon: 'check_circle' },
    info:    { bg: '#f3dcc0', color: '#7c4a1e', border: '#e8c99a', icon: 'info' },
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 gap-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: '#d9c9b0' }}>
        <div>
          <span className="uppercase tracking-widest font-semibold block" style={{ color: '#a0846a', fontSize: '0.62rem' }}>Alert Centre</span>
          <h1 className="font-bold" style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#2c1f0e' }}>Notifications</h1>
        </div>
        {allAlerts.length > 0 && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: '#f5d5d5', color: '#9b2c2c', border: '1px solid #f0b8b8' }}>
            {allAlerts.length} active alert{allAlerts.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Push permission card */}
      <div className="widget p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#f3dcc0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#7c4a1e' }}>notifications</span>
            </div>
            <div>
              <span className="font-semibold block text-sm" style={{ color: '#2c1f0e' }}>Browser Push Notifications</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: permBadge.bg, color: permBadge.color }}>
                  {permBadge.label}
                </span>
              </div>
            </div>
          </div>
          {notifPermission !== 'granted' && notifPermission !== 'denied' ? (
            <button onClick={enableNotifications}
              className="px-4 py-2 rounded-xl font-semibold text-sm"
              style={{ background: '#7c4a1e', color: '#f3dcc0' }}>
              Enable Push
            </button>
          ) : notifPermission === 'denied' ? (
            <span className="text-xs" style={{ color: '#9b2c2c' }}>Enable in browser settings → Site permissions</span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#5a6e3a' }} />
              <span className="text-xs font-semibold" style={{ color: '#5a6e3a' }}>Active</span>
            </div>
          )}
        </div>

        {/* Master toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
          <div>
            <span className="font-semibold text-sm block" style={{ color: '#2c1f0e' }}>Send Budget & Goal Alerts</span>
            <span className="text-xs" style={{ color: '#a0846a' }}>Budget thresholds, goal milestones, recurring due-dates</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
            <input type="checkbox" checked={notificationsEnabled} onChange={e => {
              if (e.target.checked && notifPermission !== 'granted') enableNotifications();
              else setNotificationsEnabled(e.target.checked);
            }} className="sr-only"/>
            <div className="w-10 h-6 rounded-full transition-colors" style={{ background: notificationsEnabled ? '#7c4a1e' : '#d9c9b0' }} />
            <div className="w-4 h-4 rounded-full absolute left-1 transition-transform shadow"
              style={{ background: '#fffdf9', transform: notificationsEnabled ? 'translateX(16px)' : 'translateX(0)' }} />
          </label>
        </div>
      </div>

      {/* Notification types */}
      <div className="widget p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-sm mb-1" style={{ color: '#2c1f0e' }}>What Triggers Notifications</h2>
        {[
          { icon: 'warning',     title: 'Budget Thresholds',    desc: 'At 80% and 100% of your category spending limit', active: notificationsEnabled },
          { icon: 'flag',        title: 'Goal Milestones',       desc: 'When a sinking fund hits 50%, 75%, and 100%',     active: notificationsEnabled },
          { icon: 'autorenew',   title: 'Recurring Payments',    desc: 'Day-of alert for due recurring transactions',     active: notificationsEnabled },
          { icon: 'insights',    title: 'AI Financial Insights', desc: 'Significant pattern changes detected by the agent', active: notificationsEnabled },
        ].map(n => (
          <div key={n.title} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 20, color: '#9e6c2a' }}>{n.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm block" style={{ color: '#2c1f0e' }}>{n.title}</span>
              <span className="text-xs" style={{ color: '#a0846a' }}>{n.desc}</span>
            </div>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: n.active ? '#5a6e3a' : '#d9c9b0' }} />
          </div>
        ))}
      </div>

      {/* Email */}
      <div className="widget p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>Email Notifications</h2>
        <div className="flex gap-2">
          <input type="email" value={notificationEmail} onChange={e => { setNotificationEmail(e.target.value); setEmailSaved(false); }}
            placeholder="you@example.com"
            className="flex-1 px-3 py-2 rounded-xl outline-none text-sm"
            style={{ background: '#f7f0e6', border: '1px solid #d9c9b0', color: '#2c1f0e' }} />
          <button onClick={() => { if (notificationEmail) { showToast(`Email alerts configured for ${notificationEmail}`, 'success'); setEmailSaved(true); } }}
            className="px-4 py-2 rounded-xl font-semibold text-sm"
            style={{ background: emailSaved ? '#5a6e3a' : '#7c4a1e', color: '#fff' }}>
            {emailSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
        <p className="text-xs" style={{ color: '#a0846a' }}>
          Configure <code className="rounded px-1" style={{ background: '#ede0d0' }}>VITE_RESEND_API_KEY</code> in .env to enable email delivery via Resend.
        </p>
      </div>

      {/* Current alerts */}
      <div className="widget p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>
          Current Alerts {allAlerts.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full ml-2" style={{ background: '#f5d5d5', color: '#9b2c2c' }}>{allAlerts.length}</span>}
        </h2>
        {allAlerts.length === 0 ? (
          <div className="py-6 text-center text-sm" style={{ color: '#a0846a' }}>
            <span className="material-symbols-outlined text-[32px] block mb-2">check_circle</span>
            All clear — no active alerts.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {allAlerts.map((alert, i) => {
              const s = severityStyle[alert.severity];
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <span className="material-symbols-outlined shrink-0" style={{ fontSize: 18, color: s.color }}>{s.icon}</span>
                  <span className="flex-1 text-sm font-semibold" style={{ color: s.color }}>{alert.label}</span>
                  <span className="text-xs shrink-0" style={{ color: s.color, opacity: 0.7 }}>{alert.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
