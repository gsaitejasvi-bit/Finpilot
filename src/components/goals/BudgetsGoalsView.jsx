import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function BudgetsGoalsView() {
  const { categories, goals, safeToSpend, openModal, topUpGoal, updateCategoryLimit } = useFinancial();
  const [inlineEdit, setInlineEdit] = useState({}); // { [catId]: newLimitValue }

  return (
    <div className="flex flex-col w-full px-4 sm:px-space-xl py-space-lg gap-space-lg max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-surface-container-highest pb-space-md">
        <div>
          <span className="font-label-sm text-outline uppercase tracking-wider font-semibold" style={{fontSize:'0.65rem'}}>Capital Allocation Framework</span>
          <h1 className="font-semibold text-on-surface" style={{fontFamily:"'Playfair Display',serif",fontSize:'1.5rem'}}>Budgets, Caps & Sinking Funds</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={()=>openModal('manageCategories')}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 border"
            style={{background:'#f7f0e6',color:'#6b4f35',borderColor:'#d9c9b0'}}>
            <span className="material-symbols-outlined text-[16px]">category</span>
            <span className="hidden sm:inline">Manage Categories</span>
          </button>
          <button onClick={()=>openModal('editBudgets')}
            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 border"
            style={{background:'#f7f0e6',color:'#6b4f35',borderColor:'#d9c9b0'}}>
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            <span className="hidden sm:inline">Edit Limits</span>
          </button>
          <button onClick={()=>openModal('createGoal')}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
            style={{background:'#7c4a1e',color:'#f3dcc0'}}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Create Fund</span>
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="widget p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider block" style={{color:'#a0846a'}}>Current Safe-To-Spend Liquid Floor</span>
          <span className="font-bold mt-1 block" style={{color:'#5a6e3a',fontFamily:'JetBrains Mono',fontSize:'2rem'}}>₹{safeToSpend.toLocaleString('en-IN')}</span>
          <span className="text-xs mt-0.5 block" style={{color:'#a0846a'}}>Calculated after deducting emergency reserve and scheduled commitments.</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label:'Emergency Floor',  value:`₹${(25000).toLocaleString('en-IN')}` },
            { label:'Sinking Funds Sum', value:`₹${goals.reduce((a,g)=>a+g.current,0).toLocaleString('en-IN')}` },
          ].map(s=>(
            <div key={s.label} className="px-3 py-2 rounded-lg text-center border" style={{background:'#f7f0e6',borderColor:'#d9c9b0'}}>
              <span className="text-xs block" style={{color:'#a0846a'}}>{s.label}</span>
              <span className="font-semibold text-sm block mt-0.5 font-mono" style={{color:'#2c1f0e'}}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Goals grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {goals.map(goal=>{
          const pct = Math.min(100, goal.percentage);
          return (
            <div key={goal.id} className="widget p-space-md flex flex-col justify-between gap-space-md">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm" style={{color:'#2c1f0e'}}>{goal.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-semibold font-mono" style={{background:'#f3dcc0',color:'#7c4a1e'}}>{pct.toFixed(1)}%</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-bold text-xl font-mono" style={{color:'#2c1f0e'}}>₹{goal.current.toLocaleString('en-IN')}</span>
                  <span className="text-xs" style={{color:'#a0846a'}}>Target: ₹{goal.target.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden border" style={{background:'#ede0d0',borderColor:'#d9c9b0'}}>
                  <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:pct>=100?'#5a6e3a':'#7c4a1e'}}/>
                </div>
                <span className="text-xs" style={{color:'#a0846a'}}>
                  {goal.daysRemaining ? `Est. completion in ${goal.daysRemaining} days.` : `Covers ${goal.monthsCovered} months of fixed liabilities.`}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{borderColor:'#d9c9b0'}}>
                <button onClick={()=>topUpGoal(goal.id,1000)} className="px-3 py-1 rounded text-xs font-semibold border" style={{background:'#f7f0e6',color:'#2c1f0e',borderColor:'#d9c9b0'}}>+₹1,000</button>
                <button onClick={()=>topUpGoal(goal.id,5000)} className="px-3 py-1 rounded text-xs font-semibold" style={{background:'#7c4a1e',color:'#f3dcc0'}}>+₹5,000</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Caps Table */}
      <div className="widget p-space-lg flex flex-col gap-space-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold text-sm" style={{color:'#2c1f0e'}}>Category Spending Caps</span>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{color:'#a0846a'}}>Resetting in 11 days</span>
            <button onClick={()=>openModal('editBudgets')}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
              style={{background:'#f3dcc0',color:'#7c4a1e'}}>
              <span className="material-symbols-outlined text-[12px]">edit</span> Edit All
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {categories.map(cat=>{
            const pct = Math.min(100, Math.round((cat.spent / cat.limit) * 100));
            const remaining = Math.max(0, cat.limit - cat.spent);
            const isOver = pct >= 100, isWarn = pct >= 80 && !isOver;
            const editing = inlineEdit[cat.id] !== undefined;
            return (
              <div key={cat.id} className="p-3 rounded-xl border flex flex-col gap-2" style={{background:'#f7f0e6',borderColor:'#d9c9b0'}}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm" style={{color:'#2c1f0e'}}>{cat.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold`}
                      style={isOver?{background:'#f5d5d5',color:'#9b2c2c'}:isWarn?{background:'#faecd3',color:'#9e6c2a'}:{background:'#deedc8',color:'#3d5420'}}>
                      {pct}% {isOver?'Exceeded':isWarn?'Near Limit':'OK'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editing ? (
                      <>
                        <span className="text-xs" style={{color:'#6b4f35'}}>₹</span>
                        <input type="number" autoFocus
                          className="w-24 px-2 py-1 rounded-lg text-sm outline-none text-right font-mono"
                          style={{background:'#fffdf9',border:'1px solid #7c4a1e',color:'#2c1f0e'}}
                          value={inlineEdit[cat.id]}
                          onChange={e=>setInlineEdit(p=>({...p,[cat.id]:e.target.value}))}
                          onKeyDown={e=>{ if(e.key==='Enter'){ updateCategoryLimit(cat.id,inlineEdit[cat.id]); setInlineEdit(p=>{const n={...p};delete n[cat.id];return n;}); } if(e.key==='Escape'){ setInlineEdit(p=>{const n={...p};delete n[cat.id];return n;}); } }}
                        />
                        <button onClick={()=>{ updateCategoryLimit(cat.id,inlineEdit[cat.id]); setInlineEdit(p=>{const n={...p};delete n[cat.id];return n;}); }}
                          className="text-xs px-2 py-1 rounded font-semibold" style={{background:'#5a6e3a',color:'#fff'}}>✓</button>
                        <button onClick={()=>setInlineEdit(p=>{const n={...p};delete n[cat.id];return n;})}
                          className="text-xs px-2 py-1 rounded" style={{color:'#a0846a'}}>✕</button>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-sm font-mono" style={{color:'#2c1f0e'}}>₹{cat.spent.toLocaleString('en-IN')} <span style={{color:'#a0846a',fontWeight:400}}>/ ₹{cat.limit.toLocaleString('en-IN')}</span></span>
                        <button onClick={()=>setInlineEdit(p=>({...p,[cat.id]:cat.limit}))}
                          className="w-6 h-6 flex items-center justify-center rounded"
                          style={{color:'#6b4f35',background:'#ede0d0'}}>
                          <span className="material-symbols-outlined text-[13px]">edit</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{background:'#ede0d0'}}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{width:`${pct}%`,background:isOver?'#9b2c2c':isWarn?'#9e6c2a':'#5a6e3a'}}/>
                </div>
                <div className="flex items-center justify-between text-xs" style={{color:'#a0846a'}}>
                  <span>₹{remaining.toLocaleString('en-IN')} remaining</span>
                  <span>Daily: ₹{Math.round(remaining/11).toLocaleString('en-IN')}/day</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
