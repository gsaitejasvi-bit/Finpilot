import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

const BAR_COLORS = ['#7c4a1e','#9e6c2a','#5a6e3a','#6b4f35','#a0846a','#c4882e'];

// ─── Spending Over Time Bar Chart ────────────────────────────────────────────
export function SpendingBarChart() {
  const { spendingHistory, categories } = useFinancial();
  const [hoveredBar, setHoveredBar] = useState(null);
  const [mode, setMode] = useState('total'); // total | stacked

  if (!spendingHistory || spendingHistory.length === 0) return null;

  const maxVal = Math.max(...spendingHistory.map(m => m.total || 0));
  const chartH  = 160;
  const barW    = 44;
  const gap     = 14;
  const chartW  = spendingHistory.length * (barW + gap);
  const catKeys = ['food','transport','shopping','utilities'];
  const catNames = ['Food & Dining','Transportation','Shopping & Tech','Utilities & Bills'];

  return (
    <div className="widget p-6 flex flex-col gap-4 animate-float-up">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#f3dcc0,#e8c99a)'}}>
            <span className="material-symbols-outlined text-[17px]" style={{color:'#7c4a1e'}}>bar_chart</span>
          </div>
          <div>
            <span className="font-semibold block" style={{color:'#2c1f0e',fontSize:'0.95rem'}}>Spending Over Time</span>
            <span style={{color:'#a0846a',fontSize:'0.62rem'}}>Monthly outflow by category</span>
          </div>
        </div>
        <div className="flex gap-1">
          {['total','stacked'].map(m=>(
            <button key={m} onClick={()=>setMode(m)}
              className="px-2.5 py-1 text-xs rounded font-semibold capitalize"
              style={mode===m?{background:'#7c4a1e',color:'#f3dcc0'}:{background:'#f7f0e6',color:'#6b4f35',border:'1px solid #d9c9b0'}}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg width={chartW + 40} height={chartH + 48} style={{minWidth:320}}>
          {/* Grid lines */}
          {[0,0.25,0.5,0.75,1].map(f=>(
            <g key={f}>
              <line x1={30} x2={chartW+30} y1={chartH*(1-f)} y2={chartH*(1-f)} stroke="#d9c9b0" strokeDasharray="3,3" strokeWidth="0.75"/>
              <text x={24} y={chartH*(1-f)+4} textAnchor="end" style={{fontSize:8,fill:'#a0846a',fontFamily:'JetBrains Mono'}}>
                {Math.round(maxVal*f/1000)}k
              </text>
            </g>
          ))}

          {/* Bars */}
          {spendingHistory.map((month, mi) => {
            const x = 30 + mi*(barW+gap) + gap/2;
            const isHov = hoveredBar === mi;
            if (mode === 'stacked') {
              let yOffset = 0;
              return (
                <g key={mi} onMouseEnter={()=>setHoveredBar(mi)} onMouseLeave={()=>setHoveredBar(null)} style={{cursor:'pointer'}}>
                  {catKeys.map((k,ci)=>{
                    const val = month[k] || 0;
                    const bh  = maxVal > 0 ? (val/maxVal)*chartH : 0;
                    const y   = chartH - yOffset - bh;
                    yOffset  += bh;
                    return <rect key={k} x={x} y={y} width={barW} height={bh} fill={BAR_COLORS[ci]} opacity={isHov?1:0.82} rx={2}/>;
                  })}
                  {isHov && (
                    <text x={x+barW/2} y={chartH - yOffset - 6} textAnchor="middle" style={{fontSize:9,fill:'#2c1f0e',fontWeight:700,fontFamily:'JetBrains Mono'}}>
                      ₹{(month.total/1000).toFixed(1)}k
                    </text>
                  )}
                  <text x={x+barW/2} y={chartH+14} textAnchor="middle" style={{fontSize:9,fill:'#6b4f35',fontFamily:'Geist,sans-serif'}}>{month.month}</text>
                </g>
              );
            }
            // total mode
            const bh  = maxVal > 0 ? ((month.total||0)/maxVal)*chartH : 0;
            const y   = chartH - bh;
            return (
              <g key={mi} onMouseEnter={()=>setHoveredBar(mi)} onMouseLeave={()=>setHoveredBar(null)} style={{cursor:'pointer'}}>
                <rect x={x} y={y} width={barW} height={bh} fill={isHov?'#a0632e':'#7c4a1e'} rx={4} opacity={0.9}/>
                {isHov && (
                  <text x={x+barW/2} y={y-6} textAnchor="middle" style={{fontSize:9,fill:'#2c1f0e',fontWeight:700,fontFamily:'JetBrains Mono'}}>
                    ₹{((month.total||0)/1000).toFixed(1)}k
                  </text>
                )}
                <text x={x+barW/2} y={chartH+14} textAnchor="middle" style={{fontSize:9,fill:'#6b4f35',fontFamily:'Geist,sans-serif'}}>{month.month}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      {mode === 'stacked' && (
        <div className="flex flex-wrap gap-3 mt-1">
          {catKeys.map((k,i)=>(
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{background:BAR_COLORS[i]}}/>
              <span style={{color:'#6b4f35',fontSize:'0.68rem'}}>{catNames[i]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Goal Projection Curve ────────────────────────────────────────────────────
export function GoalProjectionChart() {
  const { goals, inflow, outflow } = useFinancial();
  const [selectedGoal, setSelectedGoal] = useState(0);

  const goal = goals[selectedGoal];
  if (!goal) return null;

  const surplus    = Math.max(0, inflow - outflow);
  const monthly20  = Math.max(1, surplus * 0.20);
  const monthly30  = Math.max(1, surplus * 0.30);
  const remaining  = Math.max(0, goal.target - goal.current);
  const maxMonths  = remaining > 0 ? Math.ceil(remaining / monthly20) + 2 : 12;

  // Build projection arrays (months 0..maxMonths)
  const pts20 = [], pts30 = [], ptsFlat = [];
  for (let m = 0; m <= maxMonths; m++) {
    pts20.push(Math.min(goal.target, goal.current + m * monthly20));
    pts30.push(Math.min(goal.target, goal.current + m * monthly30));
    ptsFlat.push(goal.current); // no contribution baseline
  }

  const W = 560, H = 140;
  const toX = m => 40 + (m / maxMonths) * (W - 60);
  const toY = v => H - 10 - ((v - 0) / goal.target) * (H - 20);

  const pathFrom = (pts) => pts.map((v,i) => `${i===0?'M':'L'} ${toX(i)} ${toY(v)}`).join(' ');

  return (
    <div className="widget p-6 flex flex-col gap-4 animate-float-up" style={{animationDelay:'80ms'}}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#deedc8,#c4db9e)'}}>
            <span className="material-symbols-outlined text-[17px]" style={{color:'#3d5420'}}>show_chart</span>
          </div>
          <div>
            <span className="font-semibold block" style={{color:'#2c1f0e',fontSize:'0.95rem'}}>Goal Projection Curve</span>
            <span style={{color:'#a0846a',fontSize:'0.62rem'}}>Expected progress toward target</span>
          </div>
        </div>
        <select className="px-2 py-1 rounded-lg text-xs font-semibold outline-none" style={{background:'#f7f0e6',border:'1px solid #d9c9b0',color:'#2c1f0e'}}
          value={selectedGoal} onChange={e=>setSelectedGoal(Number(e.target.value))}>
          {goals.map((g,i)=><option key={g.id} value={i}>{g.name}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <svg width={W} height={H + 40} viewBox={`0 0 ${W} ${H+40}`} style={{minWidth:320}}>
          <defs>
            <linearGradient id="proj20-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c4a1e" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="#7c4a1e" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="proj30-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5a6e3a" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#5a6e3a" stopOpacity="0"/>
            </linearGradient>
          </defs>

          {/* Target line */}
          <line x1={40} x2={W-20} y1={toY(goal.target)} y2={toY(goal.target)} stroke="#5a6e3a" strokeDasharray="5,3" strokeWidth="1.2"/>
          <text x={W-18} y={toY(goal.target)+4} style={{fontSize:8,fill:'#5a6e3a',fontFamily:'JetBrains Mono'}}>Target</text>

          {/* Current line */}
          <line x1={40} x2={W-20} y1={toY(goal.current)} y2={toY(goal.current)} stroke="#d9c9b0" strokeDasharray="3,3" strokeWidth="0.8"/>

          {/* Y axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(f=>(
            <text key={f} x={36} y={toY(goal.target*f)+4} textAnchor="end" style={{fontSize:8,fill:'#a0846a',fontFamily:'JetBrains Mono'}}>
              {Math.round(goal.target*f/1000)}k
            </text>
          ))}

          {/* Fill areas */}
          <path d={`${pathFrom(pts20)} L ${toX(maxMonths)} ${H} L ${toX(0)} ${H} Z`} fill="url(#proj20-grad)"/>
          <path d={`${pathFrom(pts30)} L ${toX(maxMonths)} ${H} L ${toX(0)} ${H} Z`} fill="url(#proj30-grad)"/>

          {/* 20% surplus path */}
          <path d={pathFrom(pts20)} fill="none" stroke="#7c4a1e" strokeWidth="2" strokeLinecap="round"/>
          {/* 30% surplus path */}
          <path d={pathFrom(pts30)} fill="none" stroke="#5a6e3a" strokeWidth="2" strokeLinecap="round" strokeDasharray="6,3"/>

          {/* X axis labels every ~3 months */}
          {Array.from({length:Math.min(7,maxMonths+1)},(_, i)=>Math.round(i*maxMonths/6)).map(m=>(
            <text key={m} x={toX(m)} y={H+18} textAnchor="middle" style={{fontSize:8,fill:'#6b4f35',fontFamily:'Geist,sans-serif'}}>
              m{m}
            </text>
          ))}

          {/* Current position dot */}
          <circle cx={toX(0)} cy={toY(goal.current)} r={4} fill="#7c4a1e"/>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded" style={{background:'#7c4a1e'}}/>
          <span style={{color:'#6b4f35',fontSize:'0.68rem'}}>20% surplus (₹{Math.round(monthly20).toLocaleString('en-IN')}/mo)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded" style={{background:'#5a6e3a',borderTop:'2px dashed #5a6e3a'}}/>
          <span style={{color:'#6b4f35',fontSize:'0.68rem'}}>30% surplus (₹{Math.round(monthly30).toLocaleString('en-IN')}/mo)</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span style={{color:'#a0846a',fontSize:'0.68rem'}}>Progress: {goal.percentage.toFixed(1)}% · Remaining: ₹{remaining.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
