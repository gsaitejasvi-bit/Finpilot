import React from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function BankingSettings() {
  const { bankAccounts, bankLoading, bankSyncing, syncBankAccounts, showToast } = useFinancial();

  const totalBalance = bankAccounts
    .filter(a => a.balance > 0)
    .reduce((s, a) => s + a.balance, 0);

  return (
    <div className="widget p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{color:'#5a6e3a'}}>hub</span>
          <h2 className="font-semibold" style={{color:'#2c1f0e',fontSize:'1rem'}}>Open Banking Aggregators</h2>
        </div>
        <button onClick={syncBankAccounts} disabled={bankSyncing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all"
          style={{background:bankSyncing?'#d9c9b0':'#5a6e3a',color:'#fff',opacity:bankSyncing?0.7:1}}>
          <span className="material-symbols-outlined text-[15px]" style={bankSyncing?{animation:'spin 1s linear infinite'}:{}}>{bankSyncing?'sync':'sync'}</span>
          {bankSyncing ? 'Syncing…' : 'Sync Accounts'}
        </button>
      </div>

      {/* AA source badge */}
      <div className="rounded-lg px-3 py-2 flex items-center gap-2" style={{background:'#f3dcc0',border:'1px solid #e8c99a'}}>
        <span className="material-symbols-outlined text-[16px]" style={{color:'#7c4a1e'}}>info</span>
        <span className="text-xs" style={{color:'#7c4a1e'}}>
          Using <strong>Setu AA sandbox</strong> (mock data). Add <code className="rounded px-1" style={{background:'rgba(124,74,30,0.15)'}}>VITE_SETU_CLIENT_ID</code> + <code className="rounded px-1" style={{background:'rgba(124,74,30,0.15)'}}>VITE_SETU_CLIENT_SECRET</code> in .env to connect real accounts.
        </span>
      </div>

      {bankLoading ? (
        <div className="py-6 text-center text-sm" style={{color:'#a0846a'}}>Loading accounts…</div>
      ) : (
        <>
          {/* Account list */}
          <div className="flex flex-col gap-2">
            {bankAccounts.map(acc=>(
              <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl" style={{background:'#f7f0e6',border:'1px solid #d9c9b0'}}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#f3dcc0,#e8c99a)'}}>
                    <span className="material-symbols-outlined text-[18px]" style={{color:'#7c4a1e'}}>account_balance</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-sm" style={{color:'#2c1f0e'}}>{acc.bankName} · {acc.accountType}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{color:'#a0846a'}}>{acc.maskedNumber}</span>
                      <div className="w-1.5 h-1.5 rounded-full" style={{background:'#5a6e3a'}}/>
                      <span className="text-xs" style={{color:'#5a6e3a'}}>{acc.latency}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold block" style={{color:acc.balance<0?'#9b2c2c':'#2c1f0e',fontFamily:'JetBrains Mono',fontSize:'0.875rem'}}>
                    {acc.balance < 0 ? '-' : ''}₹{Math.abs(acc.balance).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs" style={{color:'#a0846a'}}>
                    {new Date(acc.lastSync).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          {bankAccounts.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{background:'#deedc8',border:'1px solid #c4db9e'}}>
              <span className="text-xs font-semibold" style={{color:'#3d5420'}}>Total Positive Balance</span>
              <span className="font-bold text-sm font-mono" style={{color:'#3d5420'}}>₹{totalBalance.toLocaleString('en-IN')}</span>
            </div>
          )}

          {/* Link new */}
          <button onClick={()=>showToast('Connecting to Account Aggregator (AA) sandbox — add SETU credentials in .env', 'info')}
            className="flex items-center gap-1.5 text-xs font-semibold self-start"
            style={{color:'#7c4a1e',textDecoration:'underline',textUnderlineOffset:2}}>
            <span className="material-symbols-outlined text-[14px]">add_circle</span>
            Link New Bank Account
          </button>
        </>
      )}
    </div>
  );
}
