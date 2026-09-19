import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function ExpensesView() {
  const {
    transactions, outflow, exportData,
    recalibrateLedger, openModal,
    editTransaction, deleteTransaction, categories,
    setActiveTab,
  } = useFinancial();

  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [expandedId,     setExpandedId]     = useState(null);
  const [editingId,      setEditingId]      = useState(null);
  const [editForm,       setEditForm]       = useState({ title: '', amount: '', category: '' });

  const catNames = ['All', ...categories.map(c => c.name), 'Income'];

  const filtered = transactions.filter(tx => {
    const matchCat    = filterCategory === 'All' || tx.category === filterCategory;
    const matchSearch = !searchQuery || [tx.title, tx.category, tx.account, tx.merchant || '']
      .some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const startEdit = (tx) => {
    setEditingId(tx.id);
    setEditForm({ title: tx.title, amount: String(Math.abs(tx.amount)), category: tx.category });
  };

  const saveEdit = () => {
    editTransaction(editingId, { title: editForm.title, amount: Number(editForm.amount), category: editForm.category });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 gap-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: '#d9c9b0' }}>
        <div>
          <span className="uppercase tracking-widest font-semibold block" style={{ color: '#a0846a', fontSize: '0.62rem' }}>Institutional Ledger</span>
          <h1 className="font-bold" style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#2c1f0e' }}>Expenses & Cash Flow</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={recalibrateLedger}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 border"
            style={{ background: '#f7f0e6', color: '#2c1f0e', borderColor: '#d9c9b0' }}>
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span className="hidden sm:inline">Reconcile</span>
          </button>
          <button onClick={() => exportData('csv')}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 border"
            style={{ background: '#f7f0e6', color: '#2c1f0e', borderColor: '#d9c9b0' }}>
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button onClick={() => openModal('addTx')}
            className="px-3.5 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            style={{ background: '#7c4a1e', color: '#f3dcc0' }}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Record</span>
          </button>
        </div>
      </div>

      {/* Recurring shortcut */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: '#a0846a' }}>Need to manage auto-scheduled payments?</span>
        <button onClick={() => setActiveTab('recurring')}
          className="text-xs font-semibold"
          style={{ color: '#7c4a1e', textDecoration: 'underline', textUnderlineOffset: 2 }}>
          Open Recurring Payments →
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Monthly Outflow',       value: `₹${outflow.toLocaleString('en-IN')}`, badge: 'Tracked',   badgeC: { color: '#9b2c2c', bg: '#f5d5d5' }, sub: `${transactions.length} ledger records` },
          { label: 'Average Daily Burn',    value: `₹${Math.round(outflow / 30).toLocaleString('en-IN')} / day`, badge: 'Projected', badgeC: { color: '#5a6e3a', bg: '#deedc8' }, sub: 'Based on monthly outflow' },
          { label: 'Filtered Results',      value: filtered.length, badge: 'Shown', badgeC: { color: '#7c4a1e', bg: '#f3dcc0' }, sub: `of ${transactions.length} total` },
        ].map(s => (
          <div key={s.label} className="widget p-4">
            <span className="text-xs font-semibold uppercase tracking-wider block" style={{ color: '#a0846a' }}>{s.label}</span>
            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
              <span className="font-bold text-xl font-mono" style={{ color: '#2c1f0e' }}>{s.value}</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ color: s.badgeC.color, background: s.badgeC.bg }}>{s.badge}</span>
            </div>
            <span className="text-xs mt-1 block" style={{ color: '#a0846a' }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="widget p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {catNames.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
              style={filterCategory === cat
                ? { background: '#7c4a1e', color: '#f3dcc0' }
                : { background: '#f7f0e6', color: '#6b4f35', border: '1px solid #d9c9b0' }}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center w-full sm:w-64 rounded-lg px-3 py-1.5 border" style={{ background: '#f7f0e6', borderColor: '#d9c9b0' }}>
          <span className="material-symbols-outlined text-[18px] mr-2" style={{ color: '#a0846a' }}>search</span>
          <input type="text" placeholder="Search transactions…" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm" style={{ color: '#2c1f0e' }} />
        </div>
      </div>

      {/* Transaction list */}
      <div className="widget p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between px-3 py-2 text-xs border-b uppercase font-semibold tracking-wider"
          style={{ color: '#a0846a', borderColor: '#d9c9b0' }}>
          <span>Event & Merchant</span>
          <span>Amount &amp; Actions</span>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: '#a0846a' }}>
            No transactions matching criteria.
          </div>
        )}

        {filtered.map(tx => {
          const isExpanded = expandedId === tx.id;
          const isEditing  = editingId  === tx.id;
          const isNeg      = tx.amount  < 0;
          return (
            <div key={tx.id} className="rounded-xl border" style={{ borderColor: '#d9c9b0', background: '#fffdf9' }}>

              {/* Edit form */}
              {isEditing ? (
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex gap-2 flex-wrap">
                    <input className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none min-w-0"
                      style={{ background: '#f7f0e6', border: '1px solid #d9c9b0', color: '#2c1f0e' }}
                      value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                    <input type="number" className="w-24 px-2 py-1.5 rounded-lg text-sm outline-none text-right"
                      style={{ background: '#f7f0e6', border: '1px solid #d9c9b0', color: '#2c1f0e' }}
                      value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                    <select className="px-2 py-1.5 rounded-lg text-sm outline-none"
                      style={{ background: '#f7f0e6', border: '1px solid #d9c9b0', color: '#2c1f0e' }}
                      value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                      {[...categories.map(c => c.name), 'Income'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded-lg text-xs font-semibold"
                      style={{ color: '#6b4f35', background: '#f7f0e6', border: '1px solid #d9c9b0' }}>Cancel</button>
                    <button onClick={saveEdit} className="px-3 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: '#5a6e3a', color: '#fff' }}>Save</button>
                  </div>
                </div>
              ) : (
                /* Normal row */
                <div className="p-3 flex items-center gap-3 cursor-pointer transition-colors"
                  onClick={() => setExpandedId(p => p === tx.id ? null : tx.id)}
                  onMouseEnter={e => e.currentTarget.style.background = '#fdf8f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{ background: '#f7f0e6', borderColor: '#d9c9b0' }}>
                    <span className="material-symbols-outlined text-[16px]" style={{ color: '#7c4a1e' }}>{tx.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>{tx.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#f7f0e6', color: '#6b4f35' }}>{tx.category}</span>
                      <span className="text-xs font-mono hidden sm:inline" style={{ color: '#a0846a' }}>{tx.account}</span>
                    </div>
                    <span className="text-xs" style={{ color: '#a0846a' }}>{tx.timestamp} · {tx.txId}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-sm font-mono" style={{ color: isNeg ? '#9b2c2c' : '#5a6e3a' }}>
                      {isNeg ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                    </span>
                    <button onClick={e => { e.stopPropagation(); startEdit(tx); }}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ color: '#6b4f35', background: '#ede0d0' }}>
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                    </button>
                    <button onClick={e => { e.stopPropagation(); if (window.confirm(`Delete "${tx.title}"?`)) deleteTransaction(tx.id); }}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ color: '#9b2c2c', background: '#f5d5d5' }}>
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded metadata */}
              {isExpanded && !isEditing && (
                <div className="px-3 pb-3">
                  <div className="p-3 rounded-lg text-xs flex flex-col gap-1.5 border"
                    style={{ background: '#f7f0e6', borderColor: '#d9c9b0', color: '#6b4f35' }}>
                    <div className="flex flex-wrap justify-between gap-1">
                      <span>Confidence: <strong style={{ color: '#2c1f0e' }}>{tx.confidence}</strong></span>
                      <span>Pattern: <strong style={{ color: '#2c1f0e' }}>{tx.recurring}</strong></span>
                    </div>
                    <div className="flex flex-wrap justify-between gap-1 border-t pt-1.5" style={{ borderColor: '#d9c9b0' }}>
                      <span>Merchant: <strong style={{ color: '#2c1f0e' }}>{tx.merchant}</strong></span>
                      <span>Tag: <strong style={{ color: '#2c1f0e' }}>{tx.tag}</strong></span>
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
