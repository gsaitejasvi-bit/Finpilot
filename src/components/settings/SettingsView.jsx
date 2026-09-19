import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import CurrencySelector from './CurrencySelector';
import BackupRestore from './BackupRestore';
import NotificationSettings from './NotificationSettings';
import BankingSettings from './BankingSettings';

export default function SettingsView() {
  const { emergencyFloor, safeCushion, saveSettings, demoData, setDemoData, presentationMode, setPresentationMode, showToast } = useFinancial();
  const [floorInput,   setFloorInput]   = useState(emergencyFloor);
  const [cushionInput, setCushionInput] = useState(safeCushion);

  return (
    <div className="flex flex-col w-full px-4 sm:px-space-xl py-space-lg gap-space-lg max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-surface-container-highest pb-space-md">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider block" style={{color:'#a0846a'}}>System Preferences</span>
          <h1 className="font-semibold text-on-surface" style={{fontFamily:"'Playfair Display',serif",fontSize:'1.5rem'}}>Workspace Configuration & Security Vault</h1>
        </div>
        <button onClick={()=>saveSettings(floorInput,cushionInput)}
          className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1.5"
          style={{background:'#7c4a1e',color:'#f3dcc0'}}>
          <span className="material-symbols-outlined text-[16px]">save</span> Save Changes
        </button>
      </div>

      {/* Section 1: Guardrails */}
      <div className="widget p-space-lg flex flex-col gap-space-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{color:'#7c4a1e'}}>security</span>
          <h2 className="font-semibold text-sm" style={{color:'#2c1f0e'}}>Financial Guardrails & Safe Floor</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          {[
            { label:'Emergency Reserve Floor (₹)', desc:'Agent vetoes non-essential purchases below this floor.', val:floorInput, set:setFloorInput },
            { label:'Safe-to-Spend Cushion (₹)',   desc:'Discretionary margin after commitments.', val:cushionInput, set:setCushionInput },
          ].map(s=>(
            <div key={s.label} className="flex flex-col gap-1.5">
              <label className="font-semibold text-sm" style={{color:'#2c1f0e'}}>{s.label}</label>
              <span className="text-xs" style={{color:'#a0846a'}}>{s.desc}</span>
              <input type="number" value={s.val} onChange={e=>s.set(Number(e.target.value))}
                className="mt-1 px-3 py-2 rounded-lg font-mono text-sm outline-none"
                style={{background:'#f7f0e6',border:'1px solid #d9c9b0',color:'#2c1f0e'}}/>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Open Banking */}
      <BankingSettings />

      {/* Section 3: Multi-Currency */}
      <CurrencySelector />

      {/* Section 4: Notifications */}
      <NotificationSettings />

      {/* Section 5: Backup & Restore */}
      <BackupRestore />

      {/* Section 6: Display Modes */}
      <div className="widget p-space-lg flex flex-col gap-space-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{color:'#7c4a1e'}}>tune</span>
          <h2 className="font-semibold text-sm" style={{color:'#2c1f0e'}}>Display & Sandbox Environment</h2>
        </div>
        {[
          { label:'Demo Realistic Data Feed',   desc:'Preloads simulated transactions for demonstration.', val:demoData,        set:setDemoData        },
          { label:'Presentation & Clean HUD',   desc:'Streamlines interface for executive review.',       val:presentationMode, set:setPresentationMode },
        ].map(s=>(
          <div key={s.label} className="flex items-center justify-between p-3 rounded-xl border" style={{background:'#f7f0e6',borderColor:'#d9c9b0'}}>
            <div>
              <span className="font-semibold text-sm block" style={{color:'#2c1f0e'}}>{s.label}</span>
              <span className="text-xs" style={{color:'#a0846a'}}>{s.desc}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input type="checkbox" checked={s.val} onChange={e=>{ s.set(e.target.checked); showToast(e.target.checked?`${s.label} enabled`:`${s.label} disabled`); }} className="sr-only peer"/>
              <div className="w-9 h-5 rounded-full transition-colors" style={{background:s.val?'#7c4a1e':'#d9c9b0'}}/>
              <div className="w-3.5 h-3.5 rounded-full absolute left-0.5 transition-transform" style={{background:'#fffdf9',transform:s.val?'translateX(16px)':'translateX(0)'}}/>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
