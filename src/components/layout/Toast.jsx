import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../context/FinancialContext';

const TYPE_CONFIG = {
  error: {
    bg:     '#f5d5d5',
    border: '#f0b8b8',
    text:   '#5c0e0e',
    icon:   'error',
    iconColor: '#9b2c2c',
    bar:    '#9b2c2c',
  },
  warning: {
    bg:     '#faecd3',
    border: '#f0d5a8',
    text:   '#3d2800',
    icon:   'warning',
    iconColor: '#9e6c2a',
    bar:    '#9e6c2a',
  },
  success: {
    bg:     '#deedc8',
    border: '#c4db9e',
    text:   '#1a2900',
    icon:   'check_circle',
    iconColor: '#3d5420',
    bar:    '#5a6e3a',
  },
  info: {
    bg:     '#fffdf9',
    border: '#d9c9b0',
    text:   '#2c1f0e',
    icon:   'info',
    iconColor: '#7c4a1e',
    bar:    '#7c4a1e',
  },
};

function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const cfg = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info;
  const DURATION = toast.type === 'error' ? 5000 : toast.type === 'warning' ? 4500 : 3200;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(pct);
      if (pct <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [DURATION]);

  return (
    <div
      className="animate-float-up relative overflow-hidden cursor-pointer"
      style={{
        background:   cfg.bg,
        border:       `1px solid ${cfg.border}`,
        borderRadius: '0.875rem',
        boxShadow:    '0 4px 20px rgba(80,40,10,0.15)',
        minWidth:     280,
        maxWidth:     380,
      }}
      onClick={() => onDismiss(toast.id)}
    >
      {/* Content */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${cfg.iconColor}20` }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: cfg.iconColor }}>
            {cfg.icon}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="font-label-sm font-semibold uppercase tracking-wider"
            style={{ color: cfg.iconColor, fontSize: '0.6rem' }}>
            {toast.type === 'error' ? 'Budget Exceeded' : toast.type === 'warning' ? 'Budget Alert' : toast.type === 'success' ? 'Success' : 'Notice'}
          </span>
          <span className="font-body-sm leading-snug" style={{ color: cfg.text, fontSize: '0.78rem' }}>
            {toast.message}
          </span>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDismiss(toast.id); }}
          style={{ color: cfg.iconColor, opacity: 0.6, marginTop: 2 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `${cfg.bar}20` }}>
        <div
          className="h-full transition-none"
          style={{
            width:      `${progress}%`,
            background: cfg.bar,
            transition: 'width 50ms linear',
          }}
        />
      </div>
    </div>
  );
}

export default function Toast() {
  const { toasts, setToasts } = useFinancial();

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
