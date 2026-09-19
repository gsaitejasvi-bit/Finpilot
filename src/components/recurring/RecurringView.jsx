import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

const FREQ_LABELS = { daily:'Daily', weekly:'Weekly', biweekly:'Bi-weekly', monthly:'Monthly', quarterly:'Quarterly', yearly:'Yearly' };
const FREQ_COLORS = { daily:'#9b2c2c', weekly:'#7c4a1e', biweekly:'#9e6c2a', monthly:'#5a6e3a', quarterly:'#6b4f35', yearly:'#a0846a' };

function formatNextDue(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((d - now) / 86400000);
  if (diff < 0)  return `Overdue (${Math.abs(diff)}d ago)`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days (${d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})})`;
}

function RecurringForm({ initial, onSave, onCancel, categories }) {
  const [form, setForm] = useState({
    title:     initial?.title     ?? '',
    amount:    initial ? Math.abs(initial.amount) : '',
    category:  initial?.category  ?? 'Utilities & Bills',
    frequency: initial?.frequency ?? 'monthly',
    account:   initial?.account   ?? 'NACH · Bank',
    merchant:  initial?.merchant  ?? '',
    startDate: initial?.nextDue?.slice(0,10) ?? new Date().toISOString().slice(0,10),
  });
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const inp = { className:'w-full px-3 py-2 rounded-xl outline-none', style:{background:'#f7f0e6',border:'1px solid #d9c9b0',color:'#2c1f0e'} };
  const lbl = { className:'block font-semibold mb-1', style:{color:'#6b4f35',fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.05em'} };
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label {...lbl}>Title</label><input {...inp} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Netflix, Rent" /></div>
        <div><label {...lbl}>Amount (₹)</label><input {...inp} type="number" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="1200" /></div>
        <div>
          <label {...lbl}>Category</label>
          <select {...inp} value={form.category} onChange={e=>set('category',e.target.value)}>
            {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
            <option value="Income">Income</option>
          </select>
        </div>
        <div>
          <label {...lbl}>Frequency</label>
          <select {...inp} value={form.frequency} onChange={e=>set('frequency',e.target.value)}>
            {Object.entries(FREQ_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label {...lbl}>Account</label><input {...inp} value={form.account} onChange={e=>set('account',e.target.value)} /></div>
        <div><label {...lbl}>Merchant</label><input {...inp} value={form.merchant} onChange={e=>set('merchant',e.target.value)} /></div>
        <div><label {...lbl}>Start / Next Due</label><input {...inp} type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} /></div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2" style={{borderTop:'1px solid #d9c9b0'}}>
        <button onClick={onCancel} className="px-4 py-2 rounded-xl font-semibold" style={{color:'#6b4f35',background:'#f7f0e6',border:'1px solid #d9c9b0'}}>Cancel</button>
        <button onClick={()=>onSave({...form,amount:Number(form.amount),nextDue:new Date(form.startDate).toISOString()})}
          className="px-4 py-2 rounded-xl font-semibold" style={{background:'#7c4a1e',color:'#f3dcc0'}}>
          {initial ? 'Save Changes' : 'Create Recurring'}
        </button>
      </div>
    </div>
  );
}

export default function RecurringView() {
  const { recurringTransactions, addRecurring, updateRecurring, deleteRecurring, toggleRecurringStatus, categories, showToast } = useFinancial();
  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter,    setFilter]    = useState('all'); // all | active | paused

  const filtered = recurringTransactions.filter(r => filter === 'all' || r.status === filter);
  const totalMonthly = recurringTransactions.filter(r=>r.status==='active'&&r.amount<0).reduce((a,r) => {
    const m = r.frequency==='weekly'?4:r.frequency==='biweekly'?2:r.frequency==='quarterly'?1/3:r.frequency==='yearly'?1/12:1;
    return a + Math.abs(r.amount)*m;
  }, 0);

  return (
    <div className="flex flex-col gap-space-lg max-w-[1600px] mx-auto px-space-xl py-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container-highest pb-4">
        <div>
          <span className="font-label-sm text-outline uppercase tracking-wider font-semibold" style={{fontSize:'0.65rem'}}>Auto-Commit Engine</span>
          <h1 className="font-semibold text-on-surface" style={{fontFamily:"'Playfair Display',serif",fontSize:'1.5rem'}}>Recurring Transactions</h1>
        </div>
        <button onClick={()=>{ setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-sm"
          style={{background:'#7c4a1e',color:'#f3dcc0'}}>
          <span className="material-symbols-outlined text-[16px]">add</span> New Recurring
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Active',         value:recurringTransactions.filter(r=>r.status==='active').length, unit:'items'  },
          { label:'Paused',         value:recurringTransactions.filter(r=>r.status==='paused').length, unit:'items'  },
          { label:'Monthly Outflow',value:`₹${Math.round(totalMonthly).toLocaleString('en-IN')}`,      unit:'committed' },
          { label:'Due This Week',  value:recurringTransactions.filter(r=>{ if(!r.nextDue) return false; const d=new Date(r.nextDue); return (d-new Date())/86400000<=7 && r.status==='active'; }).length, unit:'items' },
        ].map(s=>(
          <div key={s.label} className="widget p-4 flex flex-col">
            <span className="font-semibold text-2xl" style={{color:'#7c4a1e',fontFamily:'JetBrains Mono'}}>{s.value}</span>
            <span className="text-xs mt-0.5" style={{color:'#a0846a'}}>{s.label} {s.unit}</span>
          </div>
        ))}
      </div>

      {/* Add / Edit form */}
      {showForm && !editingId && (
        <div className="widget p-6 animate-float-up">
          <h3 className="font-semibold mb-4" style={{color:'#2c1f0e',fontFamily:"'Playfair Display',serif"}}>New Recurring Transaction</h3>
          <RecurringForm categories={categories} onCancel={()=>setShowForm(false)}
            onSave={form=>{ addRecurring(form); setShowForm(false); }} />
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['all','active','paused'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className="px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors"
            style={filter===f?{background:'#7c4a1e',color:'#f3dcc0'}:{background:'#f7f0e6',color:'#6b4f35',border:'1px solid #d9c9b0'}}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="widget p-8 text-center" style={{color:'#a0846a'}}>No recurring transactions. Click "+ New Recurring" to create one.</div>
        )}
        {filtered.map(rec => {
          const isEditing = editingId === rec.id;
          const isPaused  = rec.status === 'paused';
          const dueLabel  = formatNextDue(rec.nextDue);
          const isOverdue = dueLabel.startsWith('Overdue');
          const freq      = FREQ_LABELS[rec.frequency] || rec.frequency;
          return (
            <div key={rec.id} className="widget p-4 flex flex-col gap-3" style={isPaused?{opacity:0.6}:{}}>
              {isEditing ? (
                <div>
                  <h4 className="font-semibold mb-3" style={{color:'#2c1f0e'}}>Edit Recurring</h4>
                  <RecurringForm initial={rec} categories={categories}
                    onCancel={()=>setEditingId(null)}
                    onSave={form=>{ updateRecurring(rec.id,{...form,amount:rec.category==='Income'?Math.abs(form.amount):-Math.abs(form.amount)}); setEditingId(null); }} />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{background:'#f3dcc0'}}>
                      <span className="material-symbols-outlined text-[20px]" style={{color:'#7c4a1e'}}>{rec.icon||'autorenew'}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold" style={{color:'#2c1f0e'}}>{rec.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{background:FREQ_COLORS[rec.frequency]+'22',color:FREQ_COLORS[rec.frequency],border:`1px solid ${FREQ_COLORS[rec.frequency]}44`}}>
                          {freq}
                        </span>
                        {isPaused && <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'#f5d5d5',color:'#9b2c2c'}}>Paused</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs" style={{color:'#a0846a'}}>{rec.category} · {rec.account}</span>
                        <span className="text-xs font-semibold" style={{color:isOverdue?'#9b2c2c':'#5a6e3a'}}>{dueLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold" style={{color:rec.amount<0?'#9b2c2c':'#5a6e3a',fontFamily:'JetBrains Mono',fontSize:'1rem'}}>
                      {rec.amount<0?'-':'+'}₹{Math.abs(rec.amount).toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={()=>toggleRecurringStatus(rec.id)} title={isPaused?'Resume':'Pause'}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{color:'#9e6c2a',background:'#faecd3'}}>
                        <span className="material-symbols-outlined text-[16px]">{isPaused?'play_arrow':'pause'}</span>
                      </button>
                      <button onClick={()=>setEditingId(rec.id)} title="Edit"
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{color:'#6b4f35',background:'#f7f0e6'}}>
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={()=>{ if(confirm(`Delete "${rec.title}"?`)) deleteRecurring(rec.id); }} title="Delete"
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{color:'#9b2c2c',background:'#f5d5d5'}}>
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
