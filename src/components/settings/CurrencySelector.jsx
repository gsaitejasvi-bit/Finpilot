import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { CURRENCIES, convertFromINR, formatCurrency } from '../../services/apiService';

export default function CurrencySelector() {
  const { baseCurrency, setBaseCurrency, forexRates, forexLoading, forexSource, refreshForex, checkingBalance, liquidCapital, showToast } = useFinancial();
  const [open, setOpen] = useState(false);

  const rates = forexRates || {};
  const meta  = CURRENCIES[baseCurrency] || CURRENCIES.INR;

  return (
    <div className="widget p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{color:'#9e6c2a'}}>currency_exchange</span>
          <h2 className="font-semibold" style={{color:'#2c1f0e',fontSize:'1rem'}}>Multi-Currency Settings</h2>
        </div>
        <div className="flex items-center gap-2">
          {forexLoading ? (
            <span className="text-xs" style={{color:'#a0846a'}}>Updating rates…</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{background:forexSource==='live'?'#deedc8':'#f3dcc0',color:forexSource==='live'?'#3d5420':'#7c4a1e',fontSize:'0.62rem'}}>
              {forexSource === 'live' ? '● Live rates' : '● Fallback rates'}
            </span>
          )}
          <button onClick={refreshForex}
            className="w-7 h-7 flex items-center justify-center rounded-lg"
            style={{background:'#f7f0e6',color:'#6b4f35',border:'1px solid #d9c9b0'}}>
            <span className="material-symbols-outlined text-[15px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Base currency picker */}
      <div>
        <label className="block font-semibold mb-2" style={{color:'#6b4f35',fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          Base Display Currency
        </label>
        <div className="relative">
          <button onClick={()=>setOpen(o=>!o)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{background:'#f7f0e6',border:'1px solid #d9c9b0',color:'#2c1f0e'}}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{meta.flag}</span>
              <span className="font-semibold">{baseCurrency}</span>
              <span className="text-sm" style={{color:'#6b4f35'}}>{meta.name}</span>
            </div>
            <span className="material-symbols-outlined text-[18px]" style={{color:'#a0846a'}}>{open?'expand_less':'expand_more'}</span>
          </button>
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20 shadow-lg"
              style={{background:'#fffdf9',border:'1px solid #d9c9b0',maxHeight:240,overflowY:'auto'}}>
              {Object.entries(CURRENCIES).map(([code,info])=>(
                <button key={code} onClick={()=>{ setBaseCurrency(code); setOpen(false); showToast(`Base currency set to ${code}`); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{background:baseCurrency===code?'#f3dcc0':'transparent',color:'#2c1f0e'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#f7f0e6'}
                  onMouseLeave={e=>e.currentTarget.style.background=baseCurrency===code?'#f3dcc0':'transparent'}>
                  <span className="text-lg">{info.flag}</span>
                  <span className="font-semibold w-10">{code}</span>
                  <span className="text-sm" style={{color:'#6b4f35'}}>{info.name}</span>
                  <span className="ml-auto text-xs font-mono" style={{color:'#a0846a'}}>
                    {code==='INR'?'1.00':(rates[code]||0).toFixed(4)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rate table */}
      <div>
        <label className="block font-semibold mb-2" style={{color:'#6b4f35',fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          Your Balances in Other Currencies
        </label>
        <div className="rounded-xl overflow-hidden" style={{border:'1px solid #d9c9b0'}}>
          {Object.entries(CURRENCIES).slice(0,6).map(([code,info],i)=>{
            const r = rates[code] ?? 0;
            const converted = convertFromINR(checkingBalance, code, rates);
            return (
              <div key={code} className="flex items-center justify-between px-4 py-2.5"
                style={{background:i%2===0?'#fffdf9':'#f7f0e6', borderBottom:i<5?'1px solid #d9c9b0':'none'}}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{info.flag}</span>
                  <span className="font-semibold text-xs w-8">{code}</span>
                  <span className="text-xs" style={{color:'#a0846a'}}>1 INR = {r.toFixed(4)} {code}</span>
                </div>
                <span className="font-semibold text-xs font-mono" style={{color:'#7c4a1e'}}>
                  {formatCurrency(converted, code)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
