import React from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function NotificationSettings() {
  const {
    notificationsEnabled, setNotificationsEnabled,
    notificationEmail, setNotificationEmail,
    notifPermission, enableNotifications, showToast,
  } = useFinancial();

  const permColor = notifPermission === 'granted' ? '#5a6e3a' : notifPermission === 'denied' ? '#9b2c2c' : '#9e6c2a';
  const permLabel = notifPermission === 'granted' ? 'Granted' : notifPermission === 'denied' ? 'Denied' : notifPermission === 'unsupported' ? 'Not supported' : 'Not requested';

  return (
    <div className="widget p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined" style={{color:'#9e6c2a'}}>notifications</span>
        <h2 className="font-semibold" style={{color:'#2c1f0e',fontSize:'1rem'}}>Notification Preferences</h2>
      </div>

      {/* Push permission status */}
      <div className="rounded-xl p-4 flex items-center justify-between gap-3" style={{background:'#f7f0e6',border:'1px solid #d9c9b0'}}>
        <div>
          <span className="font-semibold block" style={{color:'#2c1f0e',fontSize:'0.875rem'}}>Browser Push Notifications</span>
          <span className="text-xs mt-0.5 block" style={{color:'#a0846a'}}>
            Permission status: <strong style={{color:permColor}}>{permLabel}</strong>
          </span>
        </div>
        {notifPermission !== 'granted' ? (
          <button onClick={enableNotifications}
            className="px-3 py-1.5 rounded-lg font-semibold text-xs"
            style={{background:'#7c4a1e',color:'#f3dcc0'}}>
            Enable
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#5a6e3a'}}/>
            <span className="text-xs font-semibold" style={{color:'#5a6e3a'}}>Active</span>
          </div>
        )}
      </div>

      {/* Toggle: notifications on/off */}
      <div className="flex items-center justify-between p-4 rounded-xl" style={{background:'#f7f0e6',border:'1px solid #d9c9b0'}}>
        <div>
          <span className="font-semibold block" style={{color:'#2c1f0e',fontSize:'0.875rem'}}>Send Budget & Goal Alerts</span>
          <span className="text-xs mt-0.5 block" style={{color:'#a0846a'}}>Budget threshold, goal milestone, recurring due-date notifications</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={notificationsEnabled} onChange={e=>{
            if (e.target.checked && notifPermission !== 'granted') { enableNotifications(); }
            else setNotificationsEnabled(e.target.checked);
          }} className="sr-only peer"/>
          <div className="w-9 h-5 rounded-full transition-colors peer-checked:bg-primary"
            style={{background:notificationsEnabled?'#7c4a1e':'#d9c9b0'}}/>
          <div className="w-3.5 h-3.5 rounded-full absolute left-0.5 transition-transform shadow-xs peer-checked:translate-x-4"
            style={{background:'#fffdf9'}}/>
        </label>
      </div>

      {/* Notification types summary */}
      <div className="flex flex-col gap-2">
        <label className="block font-semibold" style={{color:'#6b4f35',fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          What Triggers Notifications
        </label>
        {[
          { icon:'warning',       label:'Budget Thresholds',  desc:'At 80% and 100% of category spending limit' },
          { icon:'flag',          label:'Goal Milestones',    desc:'At 50%, 75%, and 100% completion' },
          { icon:'autorenew',     label:'Recurring Payments', desc:'Day-of alert for due recurring transactions' },
          { icon:'insights',      label:'AI Insights',        desc:'Significant spending pattern changes detected' },
        ].map(n=>(
          <div key={n.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{background:'#f7f0e6',border:'1px solid #d9c9b0'}}>
            <span className="material-symbols-outlined text-[18px]" style={{color:'#9e6c2a'}}>{n.icon}</span>
            <div className="min-w-0">
              <span className="font-semibold text-xs block" style={{color:'#2c1f0e'}}>{n.label}</span>
              <span className="text-xs" style={{color:'#a0846a'}}>{n.desc}</span>
            </div>
            <div className="ml-auto shrink-0 w-2 h-2 rounded-full" style={{background:notificationsEnabled?'#5a6e3a':'#d9c9b0'}}/>
          </div>
        ))}
      </div>

      {/* Email (cosmetic — shown for design completeness) */}
      <div>
        <label className="block font-semibold mb-1.5" style={{color:'#6b4f35',fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          Email Notification Address (optional)
        </label>
        <div className="flex gap-2">
          <input type="email" value={notificationEmail} onChange={e=>setNotificationEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 px-3 py-2 rounded-xl outline-none"
            style={{background:'#f7f0e6',border:'1px solid #d9c9b0',color:'#2c1f0e'}}/>
          <button onClick={()=>{ if(notificationEmail) showToast(`Email notifications configured for ${notificationEmail}`,'success'); }}
            className="px-3 py-2 rounded-xl font-semibold text-xs"
            style={{background:'#7c4a1e',color:'#f3dcc0'}}>
            Save
          </button>
        </div>
        <p className="text-xs mt-1" style={{color:'#a0846a'}}>
          Configure VITE_RESEND_API_KEY in .env to enable email delivery.
        </p>
      </div>
    </div>
  );
}
