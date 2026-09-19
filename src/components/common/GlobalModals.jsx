import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';

export default function GlobalModals() {
  const {
    activeModal, closeModal,
    addGoal, addTransaction, applySpendingShift,
    decisionData, checkingBalance, showToast,
    // Budget editing
    categories, updateCategoryLimit,
    // Custom categories
    addCategory, renameCategory, deleteCategory,
    // Transaction editing
    transactions, editTransaction, deleteTransaction,
    // Recurring
    addRecurring,
  } = useFinancial();

  const { currentUser, logout } = useAuth();

  function handleLogout() { closeModal(); showToast('Signed out — see you next time!'); setTimeout(logout, 800); }

  // Create Goal
  const [goalName,    setGoalName]    = useState('');
  const [goalTarget,  setGoalTarget]  = useState('25000');
  const [goalCurrent, setGoalCurrent] = useState('2000');

  // Add Transaction
  const [txTitle,    setTxTitle]    = useState('');
  const [txAmount,   setTxAmount]   = useState('');
  const [txCategory, setTxCategory] = useState('Food & Dining');
  const [txAccount,  setTxAccount]  = useState('UPI · HDFC');

  // Edit Transaction
  const [editTxId,       setEditTxId]       = useState('');
  const [editTxTitle,    setEditTxTitle]    = useState('');
  const [editTxAmount,   setEditTxAmount]   = useState('');
  const [editTxCategory, setEditTxCategory] = useState('Food & Dining');

  // Price Alert
  const [alertPrice,   setAlertPrice]   = useState('3500');
  const [alertChannel, setAlertChannel] = useState('Push Notification');

  // Spending Shift
  const [shiftAmount, setShiftAmount] = useState(2400);

  // Monte Carlo
  const [years,               setYears]               = useState(5);
  const [monthlyContribution, setMonthlyContribution] = useState(10000);

  // Budget editor
  const [editLimits, setEditLimits] = useState({});

  // Custom category
  const [newCatName,  setNewCatName]  = useState('');
  const [newCatLimit, setNewCatLimit] = useState('3000');
  const [renamingId,  setRenamingId]  = useState(null);
  const [renameVal,   setRenameVal]   = useState('');

  // Recurring modal
  const [recTitle,    setRecTitle]    = useState('');
  const [recAmount,   setRecAmount]   = useState('');
  const [recCat,      setRecCat]      = useState('Utilities & Bills');
  const [recFreq,     setRecFreq]     = useState('monthly');
  const [recAccount,  setRecAccount]  = useState('NACH · Bank');

  // Init edit tx when modal opens
  React.useEffect(()=>{
    if (activeModal === 'editTx' && transactions.length > 0) {
      const tx = transactions[0]; // will be overridden by openEditTx
      setEditTxId(tx.id); setEditTxTitle(tx.title); setEditTxAmount(String(Math.abs(tx.amount))); setEditTxCategory(tx.category);
    }
    if (activeModal === 'editBudgets') {
      const lims = {};
      categories.forEach(c => lims[c.id] = c.limit);
      setEditLimits(lims);
    }
  }, [activeModal]); // eslint-disable-line

  if (!activeModal) return null;

  const overlay   = { background:'rgba(44,31,14,0.45)', backdropFilter:'blur(8px)' };
  const cardStyle = { background:'#fffdf9', border:'1px solid #d9c9b0', borderRadius:'1.25rem', boxShadow:'0 12px 48px rgba(80,40,10,0.18)', maxHeight:'90vh', overflowY:'auto' };
  const catOptions = categories.map(c=>c.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={overlay} onClick={closeModal}>
      <div className="w-full max-w-lg animate-scale-up" style={cardStyle} onClick={e=>e.stopPropagation()}>

        {/* ── Modal 1: Create Goal ─────────────────────────────── */}
        {activeModal === 'createGoal' && (
          <div className="p-6 flex flex-col gap-4">
            <MHead icon="flag" title="Create Sinking Fund" onClose={closeModal} />
            <MField label="Goal Name"><MInput placeholder="e.g. Tokyo Trip" value={goalName} onChange={e=>setGoalName(e.target.value)} /></MField>
            <div className="grid grid-cols-2 gap-3">
              <MField label="Target Amount (₹)"><MInput type="number" value={goalTarget} onChange={e=>setGoalTarget(e.target.value)} /></MField>
              <MField label="Initial Deposit (₹)"><MInput type="number" value={goalCurrent} onChange={e=>setGoalCurrent(e.target.value)} /></MField>
            </div>
            <p className="text-xs" style={{color:'#a0846a'}}>Initial deposit is locked into this sinking fund from your checking balance.</p>
            <MFooter onCancel={closeModal} onConfirm={()=>addGoal({name:goalName,target:goalTarget,current:goalCurrent})} confirmLabel="Create Fund" />
          </div>
        )}

        {/* ── Modal 2: Add Transaction ─────────────────────────── */}
        {activeModal === 'addTx' && (
          <div className="p-6 flex flex-col gap-4">
            <MHead icon="add_circle" title="Record Transaction" onClose={closeModal} />
            <MField label="Title / Description"><MInput placeholder="e.g. Dinner with Client" value={txTitle} onChange={e=>setTxTitle(e.target.value)} /></MField>
            <div className="grid grid-cols-2 gap-3">
              <MField label="Amount (₹)"><MInput type="number" placeholder="1200" value={txAmount} onChange={e=>setTxAmount(e.target.value)} /></MField>
              <MField label="Category"><MSelect value={txCategory} onChange={e=>setTxCategory(e.target.value)} options={[...catOptions,'Income']} /></MField>
            </div>
            <MField label="Source Account"><MSelect value={txAccount} onChange={e=>setTxAccount(e.target.value)} options={['UPI · HDFC','UPI · ICICI','Credit Card · Axis','Direct NEFT']} /></MField>
            <MFooter onCancel={closeModal} onConfirm={()=>addTransaction({title:txTitle,amount:txAmount,category:txCategory,account:txAccount})} confirmLabel="Save Transaction" />
          </div>
        )}

        {/* ── Modal: Edit Transaction ──────────────────────────── */}
        {activeModal === 'editTx' && (
          <div className="p-6 flex flex-col gap-4">
            <MHead icon="edit" title="Edit Transaction" onClose={closeModal} />
            <MField label="Title"><MInput value={editTxTitle} onChange={e=>setEditTxTitle(e.target.value)} /></MField>
            <div className="grid grid-cols-2 gap-3">
              <MField label="Amount (₹)"><MInput type="number" value={editTxAmount} onChange={e=>setEditTxAmount(e.target.value)} /></MField>
              <MField label="Category"><MSelect value={editTxCategory} onChange={e=>setEditTxCategory(e.target.value)} options={[...catOptions,'Income']} /></MField>
            </div>
            <MFooter
              onCancel={closeModal}
              onConfirm={()=>{
                editTransaction(editTxId,{title:editTxTitle,amount:Number(editTxAmount),category:editTxCategory});
                closeModal();
              }}
              confirmLabel="Save Changes"
            />
          </div>
        )}

        {/* ── Modal 3: Simulate Purchase ───────────────────────── */}
        {activeModal === 'simulatePurchase' && (
          <div className="p-6 flex flex-col gap-4">
            <MHead icon="science" title="Purchase Sandbox" onClose={closeModal} />
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{background:'#f7f0e6',border:'1px solid #d9c9b0'}}>
              <MRow label="Item:"          value={decisionData.itemName||'Evaluated Purchase'} />
              <MRow label="Outlay:"        value={`₹${(decisionData.itemAmount??4000).toLocaleString('en-IN')}`} valueColor="#9b2c2c" />
              <MRow label="Balance after:" value={`₹${(checkingBalance-(decisionData.itemAmount||4000)).toLocaleString('en-IN')}`} valueColor="#5a6e3a" />
            </div>
            <MFooter onCancel={closeModal} cancelLabel="Dismiss"
              onConfirm={()=>{ addTransaction({title:`Sandbox: ${decisionData.itemName||'Item'}`,amount:decisionData.itemAmount||4000,category:'Shopping & Tech',account:'UPI · Sandbox'}); closeModal(); showToast('Applied test purchase'); }}
              confirmLabel="Apply to Ledger" />
          </div>
        )}

        {/* ── Modal 4: Price Alert ─────────────────────────────── */}
        {activeModal === 'priceAlert' && (
          <div className="p-6 flex flex-col gap-4">
            <MHead icon="notifications_active" title="Set Price Alert" onClose={closeModal} />
            <MField label="Target Price (₹)"><MInput type="number" value={alertPrice} onChange={e=>setAlertPrice(e.target.value)} /></MField>
            <MField label="Notification Channel"><MSelect value={alertChannel} onChange={e=>setAlertChannel(e.target.value)} options={['Push Notification','Email Dispatch','WhatsApp/SMS']} /></MField>
            <MFooter onCancel={closeModal} onConfirm={()=>{ closeModal(); showToast(`Alert armed for ₹${alertPrice} via ${alertChannel}`); }} confirmLabel="Arm Alert" />
          </div>
        )}

        {/* ── Modal 5: Spending Shift ──────────────────────────── */}
        {activeModal === 'spendingShift' && (
          <div className="p-6 flex flex-col gap-4">
            <MHead icon="trending_up" title="Explore Spending Shift" onClose={closeModal} />
            <p style={{color:'#2c1f0e',lineHeight:1.6,fontSize:'0.875rem'}}>
              Dining grew 28% MoM. Shifting 1 meal/wk restores{' '}
              <strong style={{color:'#5a6e3a'}}>₹2,400/month</strong> into your <em>Goa Trip Fund</em>.
            </p>
            <div className="rounded-xl p-3 flex flex-col gap-2" style={{background:'#f7f0e6',border:'1px solid #d9c9b0'}}>
              <div className="flex justify-between"><span style={{color:'#6b4f35'}}>Shift per month:</span><strong style={{color:'#7c4a1e',fontFamily:'JetBrains Mono'}}>₹{shiftAmount.toLocaleString('en-IN')}</strong></div>
              <input type="range" min="1200" max="6000" step="600" value={shiftAmount} onChange={e=>setShiftAmount(Number(e.target.value))} className="w-full cursor-pointer" style={{accentColor:'#7c4a1e'}}/>
            </div>
            <MFooter onCancel={closeModal} onConfirm={()=>applySpendingShift(shiftAmount)} confirmLabel="Apply Reallocation" />
          </div>
        )}

        {/* ── Modal 6: Monte Carlo ─────────────────────────────── */}
        {activeModal === 'monteCarlo' && (
          <div className="p-6 flex flex-col gap-4">
            <MHead icon="query_stats" title="Monte Carlo Forecast" onClose={closeModal} />
            <div className="grid grid-cols-2 gap-3">
              <MField label="Horizon (Years)"><MInput type="number" value={years} onChange={e=>setYears(Number(e.target.value))} /></MField>
              <MField label="Monthly SIP (₹)"><MInput type="number" value={monthlyContribution} onChange={e=>setMonthlyContribution(Number(e.target.value))} /></MField>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{label:'Pessimistic',mult:1.15,bg:'#f5d5d5',color:'#9b2c2c'},{label:'Expected',mult:1.38,bg:'#f3dcc0',color:'#7c4a1e'},{label:'Optimistic',mult:1.72,bg:'#deedc8',color:'#3d5420'}].map(p=>(
                <div key={p.label} className="rounded-xl p-2.5 text-center" style={{background:p.bg}}>
                  <span className="block font-label-sm" style={{color:p.color,fontSize:'0.6rem'}}>{p.label}</span>
                  <span className="block font-bold mt-1" style={{color:p.color,fontFamily:'JetBrains Mono',fontSize:'0.78rem'}}>₹{Math.round(monthlyContribution*years*12*p.mult).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <MFooter onConfirm={closeModal} confirmLabel="Done" />
          </div>
        )}

        {/* ── Modal 7: Profile ─────────────────────────────────── */}
        {activeModal === 'profile' && (
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-4" style={{borderBottom:'1px solid #d9c9b0'}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#2c1f0e,#4a3318)'}}>
                  <span className="material-symbols-outlined text-[22px]" style={{color:'#f3dcc0'}}>person</span>
                </div>
                <div>
                  <h2 className="font-semibold" style={{color:'#2c1f0e',fontFamily:"'Playfair Display',serif",fontSize:'1.1rem'}}>{currentUser?.name ?? 'User'}</h2>
                  <span className="text-xs" style={{color:'#a0846a'}}>{currentUser?.role ?? 'FinPilot'} · KYC Tier 3</span>
                </div>
              </div>
              <button onClick={closeModal} style={{color:'#a0846a'}}><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{border:'1px solid #d9c9b0'}}>
              {[['Email',currentUser?.email??'—'],['Account ID',currentUser?.id??'—'],['Banks','HDFC, ICICI, Axis'],['Encryption','ChaCha20-Poly1305 · Active']].map(([k,v],i)=>(
                <div key={k} className="flex justify-between items-center px-4 py-2.5" style={{background:i%2===0?'#fffdf9':'#f7f0e6',borderBottom:i<3?'1px solid #d9c9b0':'none'}}>
                  <span className="text-xs" style={{color:'#a0846a'}}>{k}</span>
                  <strong className="text-xs" style={{color:'#2c1f0e',fontFamily:'JetBrains Mono',wordBreak:'break-all'}}>{v}</strong>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-1">
              <button onClick={handleLogout} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm" style={{color:'#9b2c2c',background:'#f5d5d5',border:'1px solid #f0b8b8'}}>
                <span className="material-symbols-outlined text-[16px]">logout</span> Sign Out
              </button>
              <button onClick={closeModal} className="px-4 py-2 rounded-xl font-semibold text-sm" style={{background:'#7c4a1e',color:'#f3dcc0'}}>Close</button>
            </div>
          </div>
        )}

        {/* ── Modal: Edit Budgets ──────────────────────────────── */}
        {activeModal === 'editBudgets' && (
          <div className="p-6 flex flex-col gap-4">
            <MHead icon="edit_note" title="Edit Budget Limits" onClose={closeModal} />
            <p className="text-xs" style={{color:'#a0846a'}}>Changes take effect immediately and update alerts, safe-to-spend, and analytics.</p>
            <div className="flex flex-col gap-3">
              {categories.map(cat=>{
                const val = editLimits[cat.id] ?? cat.limit;
                const pct = cat.limit > 0 ? Math.min(100,Math.round((cat.spent/val)*100)) : 0;
                return (
                  <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl" style={{background:'#f7f0e6',border:'1px solid #d9c9b0'}}>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm block" style={{color:'#2c1f0e'}}>{cat.name}</span>
                      <span className="text-xs" style={{color:'#a0846a'}}>Spent: ₹{cat.spent.toLocaleString('en-IN')} ({pct}%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs" style={{color:'#6b4f35'}}>₹</span>
                      <input type="number" value={val}
                        onChange={e=>setEditLimits(prev=>({...prev,[cat.id]:Number(e.target.value)}))}
                        className="w-24 px-2 py-1.5 rounded-lg text-sm text-right outline-none font-mono"
                        style={{background:'#fffdf9',border:'1px solid #d9c9b0',color:'#2c1f0e'}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <MFooter onCancel={closeModal}
              onConfirm={()=>{ Object.entries(editLimits).forEach(([id,lim])=>updateCategoryLimit(id,lim)); closeModal(); }}
              confirmLabel="Apply All Limits" />
          </div>
        )}

        {/* ── Modal: Manage Categories ─────────────────────────── */}
        {activeModal === 'manageCategories' && (
          <div className="p-6 flex flex-col gap-4">
            <MHead icon="category" title="Manage Categories" onClose={closeModal} />
            {/* Add new */}
            <div className="flex gap-2">
              <input className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{background:'#f7f0e6',border:'1px solid #d9c9b0',color:'#2c1f0e'}}
                placeholder="New category name" value={newCatName} onChange={e=>setNewCatName(e.target.value)}/>
              <input type="number" className="w-24 px-2 py-2 rounded-xl text-sm outline-none text-right" style={{background:'#f7f0e6',border:'1px solid #d9c9b0',color:'#2c1f0e'}}
                placeholder="Limit" value={newCatLimit} onChange={e=>setNewCatLimit(e.target.value)}/>
              <button onClick={()=>{ if(newCatName.trim()){ addCategory(newCatName.trim(),newCatLimit); setNewCatName(''); }}}
                className="px-3 py-2 rounded-xl font-semibold text-sm" style={{background:'#7c4a1e',color:'#f3dcc0'}}>
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
            {/* List */}
            <div className="flex flex-col gap-2">
              {categories.map(cat=>(
                <div key={cat.id} className="flex items-center gap-2 p-2.5 rounded-xl" style={{background:'#f7f0e6',border:'1px solid #d9c9b0'}}>
                  {renamingId === cat.id ? (
                    <>
                      <input className="flex-1 px-2 py-1 rounded-lg text-sm outline-none" style={{background:'#fffdf9',border:'1px solid #d9c9b0',color:'#2c1f0e'}}
                        value={renameVal} onChange={e=>setRenameVal(e.target.value)} autoFocus/>
                      <button onClick={()=>{ renameCategory(cat.id,renameVal); setRenamingId(null); }}
                        className="px-2 py-1 rounded text-xs font-semibold" style={{background:'#5a6e3a',color:'#fff'}}>Save</button>
                      <button onClick={()=>setRenamingId(null)} className="px-2 py-1 rounded text-xs" style={{color:'#a0846a'}}>✕</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-semibold" style={{color:'#2c1f0e'}}>{cat.name}</span>
                      <span className="text-xs font-mono" style={{color:'#a0846a'}}>₹{cat.limit.toLocaleString('en-IN')}</span>
                      <button onClick={()=>{ setRenamingId(cat.id); setRenameVal(cat.name); }}
                        className="w-6 h-6 flex items-center justify-center rounded" style={{color:'#6b4f35',background:'#ede0d0'}}>
                        <span className="material-symbols-outlined text-[13px]">edit</span>
                      </button>
                      <button onClick={()=>{ if(categories.length>1) deleteCategory(cat.id); else showToast('Keep at least one category','warning'); }}
                        className="w-6 h-6 flex items-center justify-center rounded" style={{color:'#9b2c2c',background:'#f5d5d5'}}>
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <MFooter onConfirm={closeModal} confirmLabel="Done" />
          </div>
        )}

        {/* ── Modal: Add Recurring ─────────────────────────────── */}
        {activeModal === 'addRecurring' && (
          <div className="p-6 flex flex-col gap-4">
            <MHead icon="autorenew" title="New Recurring Transaction" onClose={closeModal} />
            <MField label="Title"><MInput value={recTitle} onChange={e=>setRecTitle(e.target.value)} placeholder="e.g. Netflix, Rent" /></MField>
            <div className="grid grid-cols-2 gap-3">
              <MField label="Amount (₹)"><MInput type="number" value={recAmount} onChange={e=>setRecAmount(e.target.value)} placeholder="1200" /></MField>
              <MField label="Category"><MSelect value={recCat} onChange={e=>setRecCat(e.target.value)} options={[...catOptions,'Income']} /></MField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MField label="Frequency">
                <MSelect value={recFreq} onChange={e=>setRecFreq(e.target.value)} options={['daily','weekly','biweekly','monthly','quarterly','yearly']} />
              </MField>
              <MField label="Account"><MInput value={recAccount} onChange={e=>setRecAccount(e.target.value)} /></MField>
            </div>
            <MFooter onCancel={closeModal}
              onConfirm={()=>{ if(recTitle&&recAmount) addRecurring({title:recTitle,amount:Number(recAmount),category:recCat,frequency:recFreq,account:recAccount}); }}
              confirmLabel="Create Recurring" />
          </div>
        )}

      </div>
    </div>
  );
}

// ── shared modal helpers ──────────────────────────────────────────────────
function MHead({ icon, title, onClose }) {
  return (
    <div className="flex items-center justify-between pb-3" style={{borderBottom:'1px solid #d9c9b0'}}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'#f3dcc0'}}>
          <span className="material-symbols-outlined text-[17px]" style={{color:'#7c4a1e'}}>{icon}</span>
        </div>
        <h2 className="font-semibold" style={{color:'#2c1f0e',fontFamily:"'Playfair Display',serif",fontSize:'0.95rem'}}>{title}</h2>
      </div>
      <button onClick={onClose} style={{color:'#a0846a'}}><span className="material-symbols-outlined text-[19px]">close</span></button>
    </div>
  );
}
function MFooter({ onCancel, cancelLabel='Cancel', onConfirm, confirmLabel='Confirm' }) {
  return (
    <div className="flex items-center justify-end gap-2 pt-3" style={{borderTop:'1px solid #d9c9b0'}}>
      {onCancel && <button onClick={onCancel} className="px-4 py-2 rounded-xl font-semibold text-sm" style={{color:'#6b4f35',background:'#f7f0e6',border:'1px solid #d9c9b0'}}>{cancelLabel}</button>}
      <button onClick={onConfirm} className="px-4 py-2 rounded-xl font-semibold text-sm" style={{background:'#7c4a1e',color:'#f3dcc0'}}>{confirmLabel}</button>
    </div>
  );
}
function MField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-semibold" style={{color:'#6b4f35',fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</label>
      {children}
    </div>
  );
}
function MInput({ ...props }) {
  return <input {...props} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{background:'#f7f0e6',border:'1px solid #d9c9b0',color:'#2c1f0e'}} />;
}
function MSelect({ options, ...props }) {
  return (
    <select {...props} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{background:'#f7f0e6',border:'1px solid #d9c9b0',color:'#2c1f0e'}}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function MRow({ label, value, valueColor }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span style={{color:'#6b4f35'}}>{label}</span>
      <strong style={{color:valueColor??'#2c1f0e',fontFamily:'JetBrains Mono'}}>{value}</strong>
    </div>
  );
}
