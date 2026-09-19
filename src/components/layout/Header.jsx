import React from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const {
    demoData, setDemoData,
    presentationMode, setPresentationMode,
    setIsCommandPaletteOpen,
    isMobileMenuOpen, setIsMobileMenuOpen,
    openModal, showToast,
  } = useFinancial();

  const { currentUser, logout } = useAuth();

  function handleLogout() { showToast('Signed out — see you next time!'); setTimeout(logout, 800); }

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 z-40 flex items-center justify-between px-4 sm:px-space-xl"
      style={{
        background:'rgba(253,248,242,0.85)',
        backdropFilter:'blur(16px)',
        WebkitBackdropFilter:'blur(16px)',
        borderBottom:'1px solid #d9c9b0',
        boxShadow:'0 1px 12px 0 rgba(100,60,20,0.07)',
      }}>

      {/* Left: hamburger (mobile) + search */}
      <div className="flex items-center gap-2 flex-1 max-w-lg min-w-0">
        {/* Mobile hamburger */}
        <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border shrink-0"
          style={{background:'#f7f0e6',borderColor:'#d9c9b0',color:'#6b4f35'}}
          onClick={()=>setIsMobileMenuOpen(v=>!v)}>
          <span className="material-symbols-outlined text-[20px]">{isMobileMenuOpen?'close':'menu'}</span>
        </button>

        {/* Search bar */}
        <button onClick={()=>setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-xl border transition-colors text-left min-w-0"
          style={{background:'#f7f0e6',borderColor:'#d9c9b0'}}>
          <span className="material-symbols-outlined text-[17px]" style={{color:'#a0846a'}}>search</span>
          <span className="flex-1 select-none truncate text-sm" style={{color:'#a0846a'}}>Ask FinPilot anything…</span>
          <span className="hidden sm:flex px-1.5 py-0.5 rounded-lg border text-xs shrink-0"
            style={{color:'#6b4f35',borderColor:'#d9c9b0',background:'#ede0d0'}}>⌘K</span>
        </button>

        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border whitespace-nowrap"
          style={{background:'rgba(90,110,58,0.08)',borderColor:'rgba(90,110,58,0.25)'}}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'#5a6e3a'}}/>
          <span className="font-semibold" style={{color:'#5a6e3a',fontSize:'0.65rem'}}>LIVE</span>
        </div>
      </div>

      {/* Right: toggles + profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
        {/* Demo / Present toggles — hidden on very small screens */}
        <div className="hidden md:flex items-center gap-4">
          {[
            { label:'Demo',    value:demoData,         onChange:(v)=>{ setDemoData(v); showToast(v?'Demo data active':'Live sandbox mode'); } },
            { label:'Present', value:presentationMode, onChange:(v)=>{ setPresentationMode(v); showToast(v?'Presentation mode on':'Workstation layout restored'); } },
          ].map(({ label, value, onChange })=>(
            <label key={label} className="flex items-center gap-1.5 cursor-pointer select-none">
              <span className="text-xs font-medium" style={{color:'#6b4f35'}}>{label}</span>
              <div className="relative inline-flex items-center">
                <input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)} className="sr-only peer"/>
                <div className="w-7 h-4 rounded-full transition-colors" style={{background:value?'#7c4a1e':'#d9c9b0'}}/>
                <div className="w-3 h-3 rounded-full absolute left-0.5 transition-transform shadow-xs" style={{background:'#fffdf9',transform:value?'translateX(12px)':'translateX(0)'}}/>
              </div>
            </label>
          ))}
        </div>

        <div className="hidden md:block w-px h-5" style={{background:'#d9c9b0'}}/>

        {/* Profile */}
        <button onClick={()=>openModal('profile')}
          className="flex items-center gap-2 px-1.5 py-1 rounded-xl transition-colors"
          onMouseEnter={e=>e.currentTarget.style.background='#f7f0e6'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-semibold leading-none text-sm" style={{color:'#2c1f0e'}}>{currentUser?.name?.split(' ')[0] ?? 'User'}</span>
            <span className="leading-none mt-0.5" style={{color:'#a0846a',fontSize:'0.6rem'}}>{currentUser?.role ?? 'FinPilot'}</span>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{background:'#7c4a1e'}}>
            <span className="material-symbols-outlined text-[16px]" style={{color:'#f3dcc0'}}>person</span>
          </div>
        </button>

        {/* Logout */}
        <button onClick={handleLogout} title="Sign out"
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{color:'#a0846a'}}
          onMouseEnter={e=>e.currentTarget.style.background='#f7f0e6'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </div>
    </header>
  );
}
