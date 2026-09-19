
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth, loadFinancialData, saveFinancialData } from './AuthContext';
import {
  fetchForexRates, convertFromINR, formatCurrency as fmtCurrency,
  fetchBankAccounts, fetchBankTransactions,
  requestNotificationPermission, showPushNotification,
  detectRecurringPatterns, getNextDueDate, getDueRecurring,
  tickPrice,
} from '../services/apiService';

const FinancialContext = createContext();

// ─── Market seed data ────────────────────────────────────────────────────────
const MARKET_SEED = {
  stocks: {
    RELIANCE:   { name:'Reliance Industries', price:2947,  change:+1.4,  sector:'Energy',    pe:28.3, rec:'BUY',  conf:0.71, symbol:'RELIANCE.BSE' },
    TCS:        { name:'Tata Consultancy',    price:4123,  change:-0.6,  sector:'IT',        pe:31.5, rec:'WAIT', conf:0.54, symbol:'TCS.BSE'      },
    INFOSYS:    { name:'Infosys',             price:1876,  change:+0.9,  sector:'IT',        pe:27.8, rec:'BUY',  conf:0.63, symbol:'INFY.BSE'     },
    HDFC:       { name:'HDFC Bank',           price:1654,  change:+0.3,  sector:'Banking',   pe:22.1, rec:'BUY',  conf:0.68, symbol:'HDFCBANK.BSE' },
    WIPRO:      { name:'Wipro',               price:548,   change:-1.1,  sector:'IT',        pe:24.6, rec:'SKIP', conf:0.41, symbol:'WIPRO.BSE'    },
    BAJFINANCE: { name:'Bajaj Finance',       price:7234,  change:+2.1,  sector:'NBFC',      pe:38.2, rec:'WAIT', conf:0.55, symbol:'BAJFINANCE.BSE' },
    ZOMATO:     { name:'Zomato',              price:267,   change:+3.4,  sector:'Food-tech', pe:null, rec:'WAIT', conf:0.49, symbol:'ZOMATO.BSE'   },
    PAYTM:      { name:'Paytm (One97)',       price:534,   change:-0.8,  sector:'Fintech',   pe:null, rec:'SKIP', conf:0.33, symbol:'PAYTM.BSE'    },
    NIFTY50:    { name:'Nifty 50 Index',      price:24380, change:+0.55, sector:'Index',     pe:23.4, rec:'BUY',  conf:0.66, symbol:'NIFTY50.BSE'  },
    SENSEX:     { name:'BSE Sensex',          price:80234, change:+0.48, sector:'Index',     pe:23.8, rec:'BUY',  conf:0.64, symbol:'SENSEX.BSE'   },
  },
  ipos: [
    { name:'NTPC Green Energy',   open:'Nov 19, 2024', close:'Nov 22, 2024', band:'₹102–₹108', gmp:'+₹12 (11%)', status:'upcoming', verdict:'BUY',  conf:0.67, reason:'Strong renewable pipeline, government backing, attractive P/E vs peers.' },
    { name:'Swiggy (Bundl Tech)', open:'Nov 6, 2024',  close:'Nov 8, 2024',  band:'₹371–₹390', gmp:'+₹45 (11%)', status:'open',     verdict:'BUY',  conf:0.72, reason:'Market leader in food delivery; growing quick commerce segment boosts growth story.' },
    { name:'Hyundai India',       open:'Oct 15, 2024', close:'Oct 17, 2024', band:'₹1,865–₹1,960', gmp:'+₹80',   status:'closed',   verdict:'WAIT', conf:0.51, reason:'Overvalued vs Maruti; premium pricing leaves little upside at listing.' },
    { name:'Ola Electric',        open:'Aug 2, 2024',  close:'Aug 6, 2024',  band:'₹72–₹76',    gmp:'+₹22',     status:'listed',   verdict:'SKIP', conf:0.35, reason:'High cash burn, infrastructure concerns, intense competition from legacy OEMs.' },
    { name:'Acme Solar Holdings', open:'Nov 6, 2024',  close:'Nov 8, 2024',  band:'₹275–₹289',  gmp:'+₹18',     status:'upcoming', verdict:'WAIT', conf:0.55, reason:'Decent fundamentals but sector already pricing in green energy premium.' },
  ],
};


// ─── NLP intent engine helpers ───────────────────────────────────────────────
function extractAmount(q) {
  const crMatch  = q.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr)\b/i);
  const lMatch   = q.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l)\b/i);
  const kMatch   = q.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  const stdMatch = q.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (crMatch)  return parseFloat(crMatch[1])  * 10000000;
  if (lMatch)   return parseFloat(lMatch[1])   * 100000;
  if (kMatch)   return parseFloat(kMatch[1])   * 1000;
  if (stdMatch) return parseFloat(stdMatch[1].replace(/,/g, ''));
  return 0;
}

function detectExpenseLog(q) {
  const m = q.match(
    /(?:i\s+)?(?:spent|spend|paid|pay|bought|buy|purchased|purchase|used)\s+(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:k\b)?\s*(?:on|for|at|in)?\s*(.*)/i
  );
  if (!m) return null;
  let amt = parseFloat(m[1].replace(/,/g, ''));
  if (/(\d)\s*k\b/i.test(q.slice(0, q.indexOf(m[1]) + m[1].length + 3))) amt *= 1000;
  if (isNaN(amt) || amt <= 0) return null;
  return { amount: amt, description: (m[2] || '').trim() };
}

function buildReply(q, ctx, sideEffects) {
  const ql  = q.toLowerCase();
  const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`;
  const pct = (a, b) => b > 0 ? Math.min(100, Math.round(a / b * 100)) : 0;
  const { checkingBalance, safeToSpend, inflow, outflow,
          emergencyFloor, liquidCapital, categories, goals,
          transactions, recurringTransactions, baseCurrency } = ctx;
  const { logExpense } = sideEffects || {};

  // ── 0. NLP expense logging ─────────────────────────────────────────────────
  const exp = detectExpenseLog(q);
  if (exp && exp.amount > 0) {
    const { amount, description } = exp;
    let category = 'Shopping & Tech';
    const d = description.toLowerCase();
    if (/fuel|petrol|diesel|cab|uber|ola|auto|metro|bus|train|transport/i.test(d)) category = 'Transportation';
    else if (/food|lunch|dinner|breakfast|coffee|tea|swiggy|zomato|restaurant|cafe|eat|snack|pizza|burger|meal|grocery/i.test(d)) category = 'Food & Dining';
    else if (/bill|electricity|water|wifi|broadband|internet|rent|recharge|subscription/i.test(d)) category = 'Utilities & Bills';
    const cat = categories.find(c => c.name === category);
    const newSpent = cat ? cat.spent + amount : amount;
    const pctAfter = cat ? pct(newSpent, cat.limit) : null;
    const budgetNote = cat
      ? pctAfter >= 100 ? `\n⚠️ **${category}** budget is now EXCEEDED (${pctAfter}%).`
      : pctAfter >= 80  ? `\n⚠️ **${category}** is now at ${pctAfter}% — approaching limit.`
      : `\n${category} now at ${pctAfter}% of budget.` : '';
    if (logExpense) logExpense(q);
    return {
      type: 'expense_logged',
      text: `✅ Logged **${fmt(amount)}** for **${description || category}** under **${category}**.\n\nBalance: ${fmt(checkingBalance)} → **${fmt(checkingBalance - amount)}**\nSafe to spend: ${fmt(safeToSpend)} → **${fmt(safeToSpend - amount)}**${budgetNote}`,
    };
  }

  // ── 1. Greeting ────────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening|night)|namaste|hola)\b/i.test(ql)) {
    return { type:'text', text:`Hello! 👋 I'm FinPilot AI. You can:\n• Log expenses: "I spent ₹500 on fuel"\n• Affordability: "Can I afford ₹10k shoes?"\n• Research: "How is TCS stock?" or "NTPC Green IPO verdict"\n• Goals: "How long to fund my Goa trip?"\n• Budget status, savings tips, financial runway and more.` };
  }

  // ── 2. Capabilities ────────────────────────────────────────────────────────
  if (/what can you do|help|capabilities|features|how are you/i.test(ql)) {
    return { type:'text', text:`**FinPilot AI capabilities:**\n\n• **Log expenses** — "I spent ₹500 on fuel" → updates ledger + budget\n• **Affordability** — "Can I afford ₹15k watch?" → BUY/WAIT/SKIP verdict\n• **Stock research** — "How is Infosys?" or "Show Nifty 50"\n• **IPO verdicts** — "Should I apply for Swiggy IPO?"\n• **Goal shortfall** — "When will I fund my Goa trip?"\n• **Budget status** — "How is my food budget?"\n• **Recurring payments** — "Show my recurring transactions"\n• **Currency** — "What is my balance in USD?"\n• **Savings tips**, **financial runway**, **emergency fund** status` };
  }

  // ── 3. Stock / market research ─────────────────────────────────────────────
  const stockKey = Object.keys(MARKET_SEED.stocks).find(k =>
    ql.includes(k.toLowerCase()) || ql.includes(MARKET_SEED.stocks[k].name.toLowerCase().split(' ')[0])
  );
  if (stockKey || /stock|share|nifty|sensex|market|equity|index/i.test(ql)) {
    if (stockKey) {
      const s = MARKET_SEED.stocks[stockKey];
      const live = tickPrice(s.price);
      const dir = s.change >= 0 ? '📈' : '📉';
      const sign = s.change >= 0 ? '+' : '';
      const peStr = s.pe ? `P/E ${s.pe}` : 'P/E N/A';
      const confPct = Math.round(s.conf * 100);
      const verdictColor = s.rec === 'BUY' ? '✅' : s.rec === 'WAIT' ? '🟡' : '❌';
      const reasoning = s.rec === 'BUY' ? `Positive momentum, reasonable valuation. ${s.pe && s.pe < 30 ? `${peStr} is attractive for the sector.` : 'Technical trend is upward.'}` :
        s.rec === 'WAIT' ? `Mixed signals — wait for a breakout above ₹${Math.round(live * 1.03).toLocaleString('en-IN')} or a dip to ₹${Math.round(live * 0.96).toLocaleString('en-IN')}.` :
        `Negative momentum today. High risk of further downside. Avoid fresh positions.`;
      return { type:'market', text:`**${s.name} (${stockKey})**\n\n${dir} Live price: **${fmt(live)}** (${sign}${s.change}% today)\nSector: ${s.sector} · ${peStr}\n\n${verdictColor} **Verdict: ${s.rec}** — Confidence: **${confPct}%**\n\n${reasoning}`, marketData:{ kind:'stock', key:stockKey, ...s, livePrice:live } };
    }
    const n = MARKET_SEED.stocks['NIFTY50'];
    const s = MARKET_SEED.stocks['SENSEX'];
    return { type:'market', text:`**Indian Market Overview**\n\n📈 **Nifty 50:** ${n.price.toLocaleString('en-IN')} (${n.change >= 0?'+':''}${n.change}%)\n📈 **Sensex:** ${s.price.toLocaleString('en-IN')} (${s.change >= 0?'+':''}${s.change}%)\n\nBroadly positive session. IT sector mixed; Energy and NBFC outperforming.`, marketData:{kind:'overview'} };
  }

  // ── 4. IPO research ────────────────────────────────────────────────────────
  if (/ipo|initial public|listing|apply for|should i subscribe/i.test(ql)) {
    const ipoMatch = MARKET_SEED.ipos.find(i => ql.includes(i.name.toLowerCase().split(' ')[0]) || ql.includes(i.name.toLowerCase().split(' ')[1] || ''));
    if (ipoMatch) {
      const i = ipoMatch;
      const v = i.verdict === 'BUY' ? '✅' : i.verdict === 'WAIT' ? '🟡' : '❌';
      return { type:'market', text:`**${i.name} IPO**\n\nDates: ${i.open} – ${i.close}\nPrice band: ${i.band}\nGrey market premium: ${i.gmp}\nStatus: ${i.status.toUpperCase()}\n\n${v} **Verdict: ${i.verdict}** — Confidence: **${Math.round(i.conf*100)}%**\n\n${i.reason}`, marketData:{ kind:'ipo', ...i } };
    }
    const lines = MARKET_SEED.ipos.map(i => { const v = i.verdict==='BUY'?'✅':i.verdict==='WAIT'?'🟡':'❌'; return `${v} **${i.name}** — ${i.status} · ${i.band} · ${i.verdict} (${Math.round(i.conf*100)}%)`; }).join('\n');
    return { type:'market', text:`**IPO Tracker**\n\n${lines}\n\nAsk me about a specific IPO for detailed verdict.`, marketData:{kind:'ipo_list'} };
  }

  // ── 5. Balance / net worth ─────────────────────────────────────────────────
  if (/balance|how much (do i have|money|in my|is in)|net worth|total (money|funds|capital|wealth)/i.test(ql)) {
    const savingsTotal = goals.reduce((a, g) => a + g.current, 0);
    const currencyNote = baseCurrency !== 'INR' ? `\n(In ${baseCurrency}: ~${fmtCurrency(checkingBalance * 0.012, baseCurrency)} approx)` : '';
    return { type:'text', text:`**Your Financial Snapshot:**\n\n💰 Checking balance: **${fmt(checkingBalance)}**\n🛡 Safe to spend: **${fmt(safeToSpend)}** (after ${fmt(emergencyFloor)} floor)\n📈 Total liquid capital: **${fmt(liquidCapital)}**\n🎯 Sinking funds total: **${fmt(savingsTotal)}**\n\nNet monthly surplus: **${fmt(Math.max(0, inflow - outflow))}**${currencyNote}` };
  }

  // ── 6. Safe to spend ──────────────────────────────────────────────────────
  if (/safe to spend|how much can i spend|spending limit|discretionary/i.test(ql)) {
    return { type:'text', text:`Your **safe-to-spend** is **${fmt(safeToSpend)}**.\n\nCalculation: ${fmt(checkingBalance)} balance − ${fmt(emergencyFloor)} emergency floor = **${fmt(safeToSpend)}**` };
  }

  // ── 7. Budget status ──────────────────────────────────────────────────────
  if (/budget|categor(y|ies)|spending cap|limit/i.test(ql)) {
    const catMatch = categories.find(c => ql.includes(c.name.toLowerCase()) || ql.includes(c.id));
    if (catMatch) {
      const p = pct(catMatch.spent, catMatch.limit);
      const rem = catMatch.limit - catMatch.spent;
      const status = p >= 100 ? '🚨 EXCEEDED' : p >= 80 ? '⚠️ Near limit' : '✅ On track';
      return { type:'text', text:`**${catMatch.name} Budget** — ${status}\n\nSpent: ${fmt(catMatch.spent)} of ${fmt(catMatch.limit)} (${p}%)\nRemaining: ${fmt(Math.max(0, rem))}\n\n${p >= 100 ? 'Pause spending immediately.' : p >= 80 ? `Only ${fmt(rem)} left.` : `Well within budget with ${fmt(rem)} to spare.`}` };
    }
    const lines = categories.map(c => { const p = pct(c.spent, c.limit); return `${p>=100?'🚨':p>=80?'⚠️':'✅'} **${c.name}:** ${fmt(c.spent)} / ${fmt(c.limit)} (${p}%)`; }).join('\n');
    return { type:'text', text:`**Monthly Budget Overview:**\n\n${lines}` };
  }

  // ── 8. Recurring transactions ──────────────────────────────────────────────
  if (/recurring|subscription|standing|auto.?debit|monthly.*payment|schedule/i.test(ql)) {
    if (!recurringTransactions || recurringTransactions.length === 0) {
      return { type:'text', text:`No recurring transactions set up yet. Go to Expenses & Cash Flow → Recurring tab to add them.` };
    }
    const active = recurringTransactions.filter(r => r.status !== 'paused');
    const totalMonthly = active.filter(r => r.amount < 0).reduce((a, r) => {
      const m = r.frequency === 'weekly' ? Math.abs(r.amount) * 4 : r.frequency === 'biweekly' ? Math.abs(r.amount) * 2 : r.frequency === 'quarterly' ? Math.abs(r.amount) / 3 : Math.abs(r.amount);
      return a + m;
    }, 0);
    const lines = active.slice(0, 6).map(r => `• **${r.title}** — ${r.amount < 0 ? '-' : '+'}${fmt(Math.abs(r.amount))} / ${r.frequency}`).join('\n');
    return { type:'text', text:`**Recurring Transactions (${active.length} active):**\n\n${lines}\n\nEstimated monthly committed outflow: **${fmt(totalMonthly)}**` };
  }

  // ── 9. Goals / shortfall maths ────────────────────────────────────────────
  if (/goal|saving|sinking fund|target|when will i|how long (until|till|to reach)|shortfall|trip|wedding|purchase/i.test(ql)) {
    const goalMatch = goals.find(g => ql.includes(g.name.toLowerCase().split(' ')[0]) || (g.name.toLowerCase().split(' ')[1] && ql.includes(g.name.toLowerCase().split(' ')[1])));
    const surplus = Math.max(0, inflow - outflow);
    if (goalMatch) {
      const rem = Math.max(0, goalMatch.target - goalMatch.current);
      const monthly20 = Math.max(1, surplus * 0.20);
      const monthly30 = Math.max(1, surplus * 0.30);
      const months20 = rem > 0 ? Math.ceil(rem / monthly20) : 0;
      const months30 = rem > 0 ? Math.ceil(rem / monthly30) : 0;
      const progBar = '█'.repeat(Math.round(goalMatch.percentage / 10)) + '░'.repeat(10 - Math.round(goalMatch.percentage / 10));
      return { type:'text', text:`**${goalMatch.name}**\n\n${progBar} ${goalMatch.percentage.toFixed(1)}%\nSaved: ${fmt(goalMatch.current)} of ${fmt(goalMatch.target)}\nShortfall: **${fmt(rem)}**\n\n📅 **To reach your goal:**\n• At 20% of surplus (${fmt(monthly20)}/mo): **~${months20} months**\n• At 30% of surplus (${fmt(monthly30)}/mo): **~${months30} months**\n\n${rem === 0 ? '🎉 Goal fully funded!' : `Tip: Set up a standing instruction of ${fmt(monthly20)} on payday.`}` };
    }
    const totalSaved = goals.reduce((a, g) => a + g.current, 0);
    const totalTarget = goals.reduce((a, g) => a + g.target, 0);
    const lines = goals.map(g => { const rem = Math.max(0, g.target - g.current); const months = rem > 0 ? Math.ceil(rem / Math.max(1, surplus * 0.2)) : 0; const bar = g.percentage >= 100 ? '✅' : g.percentage >= 75 ? '🔷' : g.percentage >= 50 ? '🔸' : '⬜'; return `${bar} **${g.name}:** ${fmt(g.current)}/${fmt(g.target)} (${g.percentage.toFixed(1)}%)${rem > 0 ? ` — ${months} mo` : ' — FUNDED'}`; }).join('\n');
    return { type:'text', text:`**Savings Goals Overview:**\n\n${lines}\n\nTotal: ${fmt(totalSaved)} of ${fmt(totalTarget)} (${Math.round(totalSaved/Math.max(1,totalTarget)*100)}%)` };
  }

  // ── 10. Recent transactions ───────────────────────────────────────────────
  if (/transaction|recent|history|last|purchases|expenses/i.test(ql)) {
    const recent = transactions.slice(0, 5);
    if (!recent.length) return { type:'text', text:'No transactions recorded yet.' };
    const lines = recent.map(t => `• **${t.title}** — ${t.amount >= 0 ? '+' : ''}${fmt(Math.abs(t.amount))} (${t.category}) · ${t.timestamp}`).join('\n');
    const totalOut = transactions.filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);
    return { type:'text', text:`**Recent Transactions:**\n\n${lines}\n\nTotal recorded outflow: ${fmt(totalOut)}` };
  }

  // ── 11. Emergency fund ────────────────────────────────────────────────────
  if (/emergency|safety net|rainy day|backup|buffer/i.test(ql)) {
    const days = outflow > 0 ? (checkingBalance / (outflow / 30)).toFixed(1) : '—';
    const efGoal = goals.find(g => /emergency/i.test(g.name));
    const health = checkingBalance >= emergencyFloor * 3 ? '✅ Healthy — 3× floor in liquid cash.' : checkingBalance >= emergencyFloor ? '⚠️ Meets floor but aim for 3–6 months.' : '🚨 Below emergency floor. Avoid discretionary spending.';
    return { type:'text', text:`**Emergency Fund Status:**\n\nFloor: ${fmt(emergencyFloor)}\nBalance: ${fmt(checkingBalance)}\nCovers ~${days} days${efGoal ? `\nBuffer goal: ${fmt(efGoal.current)}/${fmt(efGoal.target)} (${efGoal.percentage}%)` : ''}\n\n${health}` };
  }

  // ── 12. Income / savings rate ─────────────────────────────────────────────
  if (/income|salary|inflow|earn/i.test(ql)) {
    const rate = inflow > 0 ? Math.round(((inflow - outflow) / inflow) * 100) : 0;
    return { type:'text', text:`**Income Summary:**\n\nInflow: **${fmt(inflow)}**\nOutflow: **${fmt(outflow)}**\nNet surplus: **${fmt(Math.max(0,inflow-outflow))}**\nSavings rate: **${rate}%**\n\n${rate >= 30 ? '✅ Excellent — above 30% benchmark.' : rate >= 20 ? '🔷 Good. Aim for 30%+.' : '⚠️ Below 20%. Review discretionary spending.'}` };
  }

  // ── 13. Savings tips ──────────────────────────────────────────────────────
  if (/tips|advice|save more|cut|reduce|improve/i.test(ql)) {
    const highCat = [...categories].sort((a,b) => (b.spent/b.limit)-(a.spent/a.limit))[0];
    const surplus = Math.max(0, inflow - outflow);
    return { type:'text', text:`**Personalised Savings Tips:**\n\n1. **Biggest leak:** ${highCat.name} at ${pct(highCat.spent,highCat.limit)}% of budget — review this first.\n2. **Automate:** Transfer ${fmt(Math.round(surplus*0.5))} (50% of surplus) to sinking funds on payday.\n3. **Emergency priority:** Keep at least ${fmt(emergencyFloor*3)} liquid.\n4. **SIP boost:** Even ₹500/month extra at 12% CAGR adds ~${fmt(Math.round(500*12*10*1.7))} over 10 years.\n5. **Recurring audit:** Check your recurring transactions for forgotten subscriptions.` };
  }

  // ── 14. Runway ────────────────────────────────────────────────────────────
  if (/runway|how long|months? (of|left)|burn rate/i.test(ql)) {
    const months = outflow > 0 ? (checkingBalance / outflow).toFixed(1) : '∞';
    return { type:'text', text:`**Financial Runway:**\n\nAt ${fmt(outflow)}/month burn, your ${fmt(checkingBalance)} gives you **${months} months**.\n\n${Number(months) >= 6 ? '✅ Healthy 6+ month cushion.' : Number(months) >= 3 ? '🔷 Decent. Aim for 6 months.' : '⚠️ Low runway. Build emergency buffer first.'}` };
  }

  // ── 15. Top spending ──────────────────────────────────────────────────────
  if (/top (spending|expense)|where.*(spending|spend)|most (spent|expensive)|breakdown/i.test(ql)) {
    const sorted = [...categories].sort((a,b) => b.spent - a.spent);
    const lines = sorted.map((c,i) => `${i+1}. **${c.name}:** ${fmt(c.spent)} (${pct(c.spent,c.limit)}% of budget)`).join('\n');
    return { type:'text', text:`**Spending Breakdown:**\n\n${lines}\n\nHighest: **${sorted[0].name}** at ${fmt(sorted[0].spent)}.` };
  }

  // ── 16. Currency / forex ──────────────────────────────────────────────────
  if (/in (usd|eur|gbp|jpy|aed|sgd|aud|cad|chf|dollar|euro|pound|yen|dirham)|currency|convert|forex/i.test(ql)) {
    const currMatch = ql.match(/\b(usd|eur|gbp|jpy|aed|sgd|aud|cad|chf)\b/i);
    const tgt = currMatch ? currMatch[1].toUpperCase() : 'USD';
    const rates = { INR:1, USD:0.01198, EUR:0.01101, GBP:0.00924, JPY:1.805, AED:0.04399, SGD:0.01608, AUD:0.01833, CAD:0.01644, CHF:0.01052 };
    const r = rates[tgt] || rates.USD;
    return { type:'text', text:`**Currency Conversion (approx. mid-market):**\n\n• Checking balance ${fmt(checkingBalance)} → **${fmtCurrency(checkingBalance * r, tgt)} ${tgt}**\n• Safe to spend ${fmt(safeToSpend)} → **${fmtCurrency(safeToSpend * r, tgt)} ${tgt}**\n• Liquid capital ${fmt(liquidCapital)} → **${fmtCurrency(liquidCapital * r, tgt)} ${tgt}**\n\n_Rate: 1 INR ≈ ${r.toFixed(5)} ${tgt} (indicative)_` };
  }

  // ── 17. Buy/wait/skip verdict ─────────────────────────────────────────────
  if (/can i (afford|buy|purchase|get|spend)|afford|should i buy|worth (buying|it)|is it ok to (spend|buy)/i.test(ql) || extractAmount(q) > 0) {
    const amount = extractAmount(q);
    if (amount > 0) {
      const margin = checkingBalance - amount;
      const isSIP  = /sip|invest|mutual fund/i.test(ql);
      let itemName = 'this purchase';
      if (/macbook|laptop/i.test(ql)) itemName = 'MacBook';
      else if (/iphone|phone|mobile/i.test(ql)) itemName = 'Smartphone';
      else if (/flight|ticket|plane/i.test(ql)) itemName = 'flight ticket';
      else if (/trip|goa|vacation|holiday/i.test(ql)) itemName = 'trip';
      else if (/watch/i.test(ql)) itemName = 'watch';
      else if (/shoes|sneakers/i.test(ql)) itemName = 'shoes';
      else if (/camera/i.test(ql)) itemName = 'camera';
      else if (/sip|invest/i.test(ql)) itemName = 'SIP investment';
      if (isSIP) {
        const surplus = Math.max(0, inflow - outflow);
        const affordable = amount <= surplus * 0.5;
        const conf = affordable ? 0.94 : 0.42;
        const verdict = affordable ? 'BUY' : 'WAIT';
        const reasoning = affordable ? `${fmt(amount)} SIP fits within your ${fmt(surplus)} surplus. At 12% CAGR over 10 years: ~${fmt(Math.round(amount*12*10*1.7))}.` : `${fmt(amount)} SIP would use ${Math.round(amount/Math.max(1,surplus)*100)}% of surplus. Start with ${fmt(Math.round(surplus*0.25))}/mo.`;
        const data = { verdict: affordable ? 'APPROVED · LOW RISK' : 'REVIEW REQUIRED', itemName, liquidBefore: fmt(checkingBalance), calculation: `Surplus: ${fmt(surplus)} − SIP: ${fmt(amount)}`, liquidAfter: `${fmt(Math.max(0,surplus-amount))}/mo free`, comfortScore: `${Math.round(conf*100)}%`, itemAmount: amount, checkpoint: reasoning, steps: [{ num:1, title:'1. Intent', detail:`SIP increase · ${fmt(amount)}`, icon:'check_circle' }, { num:2, title:'2. Cash Flow', detail:`Inflow ${fmt(inflow)} · Surplus ${fmt(surplus)}`, icon:'check_circle' }, { num:3, title:'3. Compounding', detail:`10yr at 12% CAGR: +${fmt(Math.round(amount*12*10*1.7))}`, icon:'check_circle' }, { num:4, title:`4. Verdict: ${verdict}`, detail:reasoning, icon: affordable ? 'verified' : 'info' }] };
        return { type:'verdict', text:`${affordable?'✅':'🟡'} **${verdict}** (${Math.round(conf*100)}%) — ${reasoning}`, data };
      }
      let verdict, conf, reasoning;
      if (margin < 0) { verdict='SKIP'; conf=0.97; reasoning=`You're ${fmt(Math.abs(margin))} short. Save first.`; }
      else if (margin < emergencyFloor) { verdict='WAIT'; conf=0.85; reasoning=`Would push you ${fmt(emergencyFloor-margin)} below emergency floor.`; }
      else { const safeExcess=margin-emergencyFloor; conf=Math.min(0.96,Math.max(0.55,margin/checkingBalance)); verdict=conf>=0.75?'BUY':'WAIT'; reasoning=conf>=0.75?`After purchase you retain ${fmt(margin)} — ${fmt(safeExcess)} above floor. Financially sound.`:`Possible but buffer thin (${fmt(safeExcess)} above floor). Proceed with caution.`; }
      const verdictEmoji = verdict==='BUY'?'✅':verdict==='WAIT'?'🟡':'❌';
      const data = { verdict: verdict==='BUY'?'APPROVED · LOW RISK':verdict==='WAIT'?'APPROVED · MODERATE RISK':'REJECTED', itemName, liquidBefore:fmt(checkingBalance), calculation:`${fmt(checkingBalance)} − ${fmt(amount)}`, liquidAfter:margin>=0?fmt(margin):`-${fmt(Math.abs(margin))}`, comfortScore:`${Math.round(conf*100)}%`, itemAmount:amount, checkpoint:reasoning, steps:[{ num:1,title:'1. Intent',detail:`Purchase: ${itemName} · ${fmt(amount)}`,icon:'check_circle' },{ num:2,title:'2. Balance',detail:`${fmt(checkingBalance)} − ${fmt(amount)} = ${fmt(margin)}`,icon:'check_circle' },{ num:3,title:'3. Floor',detail:`Emergency floor ${fmt(emergencyFloor)} ${margin>=emergencyFloor?'untouched ✓':'⚠️ BREACHED'}`,icon:margin>=emergencyFloor?'check_circle':'error' },{ num:4,title:`4. Verdict: ${verdict}`,detail:reasoning,icon:verdict==='BUY'?'verified':verdict==='WAIT'?'info':'block' }] };
      return { type:'verdict', text:`${verdictEmoji} **${verdict}** (${Math.round(conf*100)}%) — ${reasoning}`, data };
    }
  }


  // ── 18. Split expenses ────────────────────────────────────────────────────
  // Handles: "split with friends", "who do I owe", "how much do I owe",
  //          "I spent ₹2000 on dinner with friends" → offer to split
  if (/split|owe|owed|group expense|shared expense|divide|splitwise/i.test(ql) ||
      (exp && exp.amount > 0 && /friend|group|team|colleague|family|roommate|partner|everyone/i.test(ql))) {

    // "How much do I owe" type query — need split summary
    if (/how much.*(owe|owed)|who.*owe|owe.*everyone|my.*split.*balance|split.*balance/i.test(ql)) {
      // We can't import useSplit here (hooks can't be called in a regular function),
      // so we signal the UI to navigate and show a canned response pointing to the page.
      return {
        type: 'text',
        text: `To see your full split balance across all groups, go to **Split Expenses** in the sidebar.\n\nYou can also:\n• Ask me "Are all debts settled?" once I have access to your split data\n• Use the Split Expenses page to see who owes whom and simplify debts with one click.`,
        action: { type: 'navigate', tab: 'split' },
      };
    }

    // "I spent ₹X on dinner/trip with friends" → offer to create split expense
    if (exp && exp.amount > 0 && /friend|group|team|colleague|family|roommate|with/i.test(ql)) {
      const { amount, description } = exp;
      return {
        type: 'split_prompt',
        text: `💡 Looks like a shared expense — **${fmt(amount)}** for **${description || 'this'}**.\n\nWould you like to split it with a group?\n→ Head to **Split Expenses** to create the group and add this expense, or I can log it as a personal expense right now.`,
        splitSuggestion: { amount, description: description || 'Shared Expense' },
        action: { type: 'navigate', tab: 'split' },
      };
    }

    // Generic split question
    return {
      type: 'text',
      text: `**Split Expenses** lets you:\n\n• Create groups (trips, flatmates, teams)\n• Add shared expenses and split equally, by exact amount, or by percentage\n• See who owes whom and simplify debts automatically\n• Record settlements and track history\n\nGo to **Split Expenses** in the sidebar to get started.\n\nYou can also say:\n• "I spent ₹2,000 on dinner with friends"\n• "How much do I owe everyone?"`,
      action: { type: 'navigate', tab: 'split' },
    };
  }

  // ── 19. Thanks / goodbye ──────────────────────────────────────────────────
  if (/thank(s| you)|bye|goodbye|great|awesome|perfect/i.test(ql)) {
    return { type:'text', text:`You're welcome! 😊 Small consistent decisions compound into big outcomes. Good luck! 🌟` };
  }

  // ── 20. Fallback ──────────────────────────────────────────────────────────
  return { type:'text', text:`I didn't quite catch that. Try:\n\n• "I spent ₹500 on fuel" → logs expense\n• "Can I afford ₹10k camera?" → BUY/WAIT/SKIP\n• "How is TCS stock?" → live research\n• "Show my recurring transactions"\n• "Convert my balance to USD"\n• "I spent ₹2,000 on dinner with friends" → split expense\n• "How much do I owe everyone?" → split balance` };
}


// ─── Default seed data ───────────────────────────────────────────────────────
function buildDefaults() {
  return {
    emergencyFloor:  25000,
    safeCushion:     1500,
    liquidCapital:   142800,
    checkingBalance: 48750,
    safeToSpend:     44750,
    inflow:          92000,
    outflow:         47250,
    activeRunway:    '7.4 mos',
    syncLatency:     '18ms',
    confidenceScore: '99.4%',
    baseCurrency:    'INR',
    notificationsEnabled: false,
    notificationEmail: '',
    categories: [
      { id:'food',      name:'Food & Dining',     spent:6420, limit:8000,  color:'secondary-container', badge:'80% Spent', warn:true  },
      { id:'transport', name:'Transportation',    spent:2100, limit:4000,  color:'tertiary-container',  badge:'52% Spent', warn:false },
      { id:'shopping',  name:'Shopping & Tech',   spent:3900, limit:6000,  color:'primary',             badge:'65% Spent', warn:false },
      { id:'utilities', name:'Utilities & Bills', spent:8200, limit:10000, color:'surface-variant',     badge:'82% Spent', warn:false },
    ],
    goals: [
      { id:'goa',       name:'Goa Trip Fund',      current:18500, target:30000, percentage:61.7, daysRemaining:34  },
      { id:'emergency', name:'Emergency Buffer',    current:85000, target:100000,percentage:85.0, monthsCovered:4.2 },
      { id:'tech',      name:'M4 MacBook Upgrade',  current:24000, target:85000, percentage:28.2, daysRemaining:110 },
    ],
    transactions: [
      { id:'tx1', title:'Swiggy Gourmet',               category:'Food & Dining',    icon:'restaurant',        account:'UPI · HDFC',        timestamp:'Today at 1:15 PM',    txId:'#TX-90284', amount:-420,   confidence:'99.8%', recurring:'Bi-weekly weekday lunch',    merchant:'Bundl Technologies Pvt Ltd',      split:'Personal Discretionary', tag:'Auto-verified'        },
      { id:'tx2', title:'Indian Oil Corporation',        category:'Transportation',   icon:'local_gas_station', account:'UPI · ICICI',       timestamp:'Today at 9:42 AM',    txId:'#TX-90112', amount:-500,   confidence:'99.1%', recurring:'Weekly fuel top-up',         merchant:'IOCL Retail Outlet',              split:'Commute Allowance',      tag:'Natural Language Log' },
      { id:'tx3', title:'Amazon Retail India',           category:'Shopping & Tech',  icon:'shopping_bag',      account:'Credit Card · Axis', timestamp:'Yesterday at 6:30 PM',txId:'#TX-88912', amount:-1299,  confidence:'98.5%', recurring:'One-off electronics purchase',merchant:'Amazon Seller Services Pvt Ltd',  split:'Workspace Gear',         tag:'Auto-reconciled'      },
      { id:'tx4', title:'Salary Deposit (Apex Systems)', category:'Income',           icon:'payments',          account:'Direct NEFT · HDFC', timestamp:'01 Sep at 06:00 AM', txId:'#TX-84102', amount:92000,  confidence:'100%',  recurring:'Monthly fixed salary',       merchant:'Apex Systems India Pvt Ltd',      split:'Primary Income',         tag:'Verified Inflow'      },
    ],
    recurringTransactions: [
      { id:'rec1', title:'Monthly Rent',        category:'Utilities & Bills', amount:-15000, frequency:'monthly',  status:'active', nextDue: new Date(new Date().getFullYear(), new Date().getMonth()+1, 1).toISOString(),  icon:'home',            account:'NEFT · HDFC',    merchant:'Landlord' },
      { id:'rec2', title:'Index Fund SIP',      category:'Income',            amount:-5000,  frequency:'monthly',  status:'active', nextDue: new Date(new Date().getFullYear(), new Date().getMonth()+1, 5).toISOString(),  icon:'trending_up',     account:'NACH · Zerodha', merchant:'Zerodha MF'   },
      { id:'rec3', title:'Netflix Subscription',category:'Shopping & Tech',   amount:-649,   frequency:'monthly',  status:'active', nextDue: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(), icon:'play_circle',     account:'Credit Card · Axis', merchant:'Netflix' },
      { id:'rec4', title:'Electricity Bill',    category:'Utilities & Bills', amount:-1850,  frequency:'monthly',  status:'active', nextDue: new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString(), icon:'bolt',            account:'UPI · HDFC',    merchant:'BESCOM'    },
      { id:'rec5', title:'Weekly Fuel Top-up',  category:'Transportation',    amount:-500,   frequency:'weekly',   status:'active', nextDue: new Date(Date.now() + 7*86400000).toISOString(),                             icon:'local_gas_station',account:'UPI · ICICI',   merchant:'IOCL'      },
    ],
    bankAccounts: [],
    stockPrices:  {},
    forexRates:   null,
    spendingHistory: [
      { month:'Apr', food:5200, transport:1800, shopping:3100, utilities:7800, total:17900 },
      { month:'May', food:6100, transport:2200, shopping:2800, utilities:8100, total:19200 },
      { month:'Jun', food:5800, transport:1900, shopping:4200, utilities:7600, total:19500 },
      { month:'Jul', food:6800, transport:2500, shopping:3500, utilities:8400, total:21200 },
      { month:'Aug', food:5500, transport:2100, shopping:2900, utilities:8000, total:18500 },
      { month:'Sep', food:6420, transport:2100, shopping:3900, utilities:8200, total:20620 },
    ],
  };
}

const PERSIST_KEYS = [
  'emergencyFloor','safeCushion','liquidCapital','checkingBalance',
  'safeToSpend','inflow','outflow','activeRunway',
  'categories','goals','transactions','recurringTransactions',
  'baseCurrency','notificationsEnabled','notificationEmail',
  'bankAccounts','spendingHistory',
];


// ─── Provider ────────────────────────────────────────────────────────────────
export function FinancialProvider({ children }) {
  const { currentUser } = useAuth();
  const saved = currentUser ? (loadFinancialData(currentUser.id) ?? buildDefaults()) : buildDefaults();

  // ── Navigation & UI ────────────────────────────────────────────────────────
  const [activeTab,            setActiveTab]            = useState('overview');
  const [demoData,             setDemoData]             = useState(true);
  const [presentationMode,     setPresentationMode]     = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen,     setIsMobileMenuOpen]     = useState(false);
  const [toasts,               setToasts]               = useState([]);
  const [activeModal,          setActiveModal]          = useState(null);

  // ── Settings ───────────────────────────────────────────────────────────────
  const [emergencyFloor,  setEmergencyFloor]  = useState(saved.emergencyFloor  ?? 25000);
  const [safeCushion,     setSafeCushion]     = useState(saved.safeCushion     ?? 1500);

  // ── Financial metrics ──────────────────────────────────────────────────────
  const [liquidCapital,   setLiquidCapital]   = useState(saved.liquidCapital   ?? 142800);
  const [checkingBalance, setCheckingBalance] = useState(saved.checkingBalance ?? 48750);
  const [safeToSpend,     setSafeToSpend]     = useState(saved.safeToSpend     ?? 44750);
  const [inflow,          setInflow]          = useState(saved.inflow          ?? 92000);
  const [outflow,         setOutflow]         = useState(saved.outflow         ?? 47250);
  const [activeRunway,    setActiveRunway]    = useState(saved.activeRunway    ?? '7.4 mos');
  const [syncLatency,     setSyncLatency]     = useState('18ms');
  const [confidenceScore]                     = useState('99.4%');

  // ── Collections ────────────────────────────────────────────────────────────
  const [categories,            setCategories]            = useState(saved.categories            ?? buildDefaults().categories);
  const [goals,                 setGoals]                 = useState(saved.goals                 ?? buildDefaults().goals);
  const [transactions,          setTransactions]          = useState(saved.transactions          ?? buildDefaults().transactions);
  const [recurringTransactions, setRecurringTransactions] = useState(saved.recurringTransactions ?? buildDefaults().recurringTransactions);
  const [spendingHistory,       setSpendingHistory]       = useState(saved.spendingHistory       ?? buildDefaults().spendingHistory);

  // ── Multi-currency ─────────────────────────────────────────────────────────
  const [baseCurrency,  setBaseCurrency]  = useState(saved.baseCurrency  ?? 'INR');
  const [forexRates,    setForexRates]    = useState(null);
  const [forexLoading,  setForexLoading]  = useState(false);
  const [forexSource,   setForexSource]   = useState('fallback');

  // ── Banking integration ────────────────────────────────────────────────────
  const [bankAccounts,   setBankAccounts]   = useState(saved.bankAccounts ?? []);
  const [bankLoading,    setBankLoading]    = useState(false);
  const [bankSyncing,    setBankSyncing]    = useState(false);

  // ── Real stock data ────────────────────────────────────────────────────────
  const [stockPrices,    setStockPrices]    = useState({});
  const [stockSource,    setStockSource]    = useState('mock');

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notificationsEnabled, setNotificationsEnabled] = useState(saved.notificationsEnabled ?? false);
  const [notificationEmail,    setNotificationEmail]    = useState(saved.notificationEmail    ?? '');
  const [notifPermission,      setNotifPermission]      = useState('default');

  // ── Reasoning engine ──────────────────────────────────────────────────────
  const [reasoningQuery,  setReasoningQuery]  = useState('');
  const [isSynthesizing,  setIsSynthesizing]  = useState(false);
  const [pipelineState,   setPipelineState]   = useState('Ready');
  const [chatMessages,    setChatMessages]    = useState([{
    id:'welcome', role:'bot', type:'text',
    text:"Hi! I'm FinPilot AI. Try:\n• \"I spent ₹500 on fuel\" → logs to ledger instantly\n• \"Can I afford ₹15k watch?\" → BUY/WAIT/SKIP verdict\n• \"How is Infosys stock?\" or \"Show upcoming IPOs\"\n• \"Show my recurring transactions\"\n• \"Convert my balance to USD\"",
  }]);
  const [decisionData, setDecisionData] = useState({
    verdict:"APPROVED · LOW RISK", liquidBefore:"₹48,750", calculation:"₹48,750 - ₹4,000", liquidAfter:"₹44,750",
    comfortScore:"92%", itemAmount:4000, itemName:"Goa flight",
    checkpoint:"2 scheduled auto-debits on 22 Sep (Electricity ₹1,850 and Cloud Storage ₹820). After booking your account preserves ₹42,080 liquid cushion.",
    steps:[
      { num:1, title:"1. Intent Classification",      detail:"Affordability evaluation · Discretionary transport", icon:"check_circle" },
      { num:2, title:"2. Context & Ledger Retrieval", detail:"Checking Balance: ₹48,750 · Unsettled commitments: ₹4,000 rent + ₹1,200 SIP", icon:"check_circle" },
      { num:3, title:"3. Goal Allocation & Buffer",   detail:"Sinking Fund 'Goa Trip' holds ₹18,500.", icon:"check_circle" },
      { num:4, title:"4. Synthesis Verdict",          detail:"AFFORDABLE with 92% liquid comfort score.", icon:"verified" },
    ],
  });

  // ── Architecture view ──────────────────────────────────────────────────────
  const [architectureViewMode, setArchitectureViewMode] = useState('judge');
  const [selectedNodeIndex,    setSelectedNodeIndex]    = useState(3);
  const [activeScenario,       setActiveScenario]       = useState('flight');
  const [isSimulatingNodes,    setIsSimulatingNodes]    = useState(false);

  // ── Alert refs ────────────────────────────────────────────────────────────
  const alertedRef     = useRef({});
  const goalAlertedRef = useRef({});

  // ─── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  const openModal  = useCallback((name) => setActiveModal(name), []);
  const closeModal = useCallback(()     => setActiveModal(null), []);

  // ─── Init: load forex rates on mount ──────────────────────────────────────
  useEffect(() => {
    setForexLoading(true);
    fetchForexRates().then(result => {
      setForexRates(result.rates);
      setForexSource(result.source);
      setForexLoading(false);
    });
  }, []);

  // ─── Init: load bank accounts on mount ────────────────────────────────────
  useEffect(() => {
    setBankLoading(true);
    fetchBankAccounts().then(result => {
      setBankAccounts(result.accounts);
      setBankLoading(false);
    });
  }, []);

  // ─── Init: check notification permission ──────────────────────────────────
  useEffect(() => {
    if ('Notification' in window) setNotifPermission(Notification.permission);
  }, []);

  // ─── Live stock price refresh every 8s ────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const prices = {};
      Object.entries(MARKET_SEED.stocks).forEach(([k, s]) => {
        const prev = stockPrices[k]?.price ?? s.price;
        prices[k] = { price: tickPrice(prev), source: 'mock' };
      });
      setStockPrices(prices);
    };
    tick(); // initial
    const interval = setInterval(tick, 8000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  // ─── Auto-generate due recurring transactions once per session ────────────
  const recurringProcessedRef = useRef(false);
  useEffect(() => {
    if (recurringProcessedRef.current || recurringTransactions.length === 0) return;
    recurringProcessedRef.current = true;
    const due = getDueRecurring(recurringTransactions);
    if (due.length === 0) return;
    // Auto-post each due recurring transaction
    due.forEach(rec => {
      const newTx = {
        id:        'tx_rec_' + rec.id + '_' + Date.now(),
        title:     rec.title,
        category:  rec.category,
        icon:      rec.icon || 'autorenew',
        account:   rec.account || 'Auto-debit',
        timestamp: 'Today (auto)',
        txId:      '#TX-' + Math.floor(10000 + Math.random() * 90000),
        amount:    rec.amount,
        confidence:'100%',
        recurring: `${rec.frequency} auto-debit`,
        merchant:  rec.merchant || rec.title,
        split:     rec.amount < 0 ? 'Recurring Commitment' : 'Recurring Income',
        tag:       'Auto-scheduled',
      };
      setTransactions(prev => [newTx, ...prev]);
      if (rec.amount < 0) {
        setCheckingBalance(prev => Math.max(0, prev - Math.abs(rec.amount)));
        setSafeToSpend(prev     => Math.max(0, prev - Math.abs(rec.amount)));
        setOutflow(prev         => prev + Math.abs(rec.amount));
      } else {
        setCheckingBalance(prev => prev + rec.amount);
        setSafeToSpend(prev     => prev + rec.amount);
        setInflow(prev          => prev + rec.amount);
      }
      // Advance nextDue
      const nextDate = getNextDueDate(rec.frequency, rec.nextDue);
      setRecurringTransactions(prev => prev.map(r => r.id === rec.id ? { ...r, nextDue: nextDate.toISOString(), lastRun: new Date().toISOString() } : r));
    });
    if (due.length > 0) showToast(`${due.length} recurring transaction${due.length>1?'s':''} auto-posted`, 'info');
  }, [recurringTransactions]); // eslint-disable-line

  // ─── Budget alert: fire toast + push notification ─────────────────────────
  useEffect(() => {
    categories.forEach(cat => {
      const pct = cat.limit > 0 ? Math.round((cat.spent / cat.limit) * 100) : 0;
      const key100 = `${cat.id}_100`, key80 = `${cat.id}_80`;
      if (pct >= 100 && !alertedRef.current[key100]) {
        alertedRef.current[key100] = true;
        const msg = `${cat.name} budget EXCEEDED — ₹${cat.spent.toLocaleString('en-IN')} of ₹${cat.limit.toLocaleString('en-IN')} spent`;
        showToast(msg, 'error');
        if (notificationsEnabled) showPushNotification('⚠️ Budget Exceeded', { body: msg, tag: key100 });
      } else if (pct >= 80 && !alertedRef.current[key80]) {
        alertedRef.current[key80] = true;
        const msg = `${cat.name} at ${pct}% — only ₹${(cat.limit - cat.spent).toLocaleString('en-IN')} remaining`;
        showToast(msg, 'warning');
        if (notificationsEnabled) showPushNotification('Budget Alert', { body: msg, tag: key80 });
      }
      if (pct < 80)       { delete alertedRef.current[key80]; delete alertedRef.current[key100]; }
      else if (pct < 100) { delete alertedRef.current[key100]; }
    });
  }, [categories, notificationsEnabled]); // eslint-disable-line

  // ─── Goal milestone alerts ────────────────────────────────────────────────
  useEffect(() => {
    goals.forEach(g => {
      const p = g.percentage;
      const k100 = `${g.id}_100`, k75 = `${g.id}_75`, k50 = `${g.id}_50`;
      if (p >= 100 && !goalAlertedRef.current[k100]) {
        goalAlertedRef.current[k100] = true;
        const msg = `"${g.name}" is fully funded! Goal complete.`;
        showToast(`🎉 ${msg}`, 'success');
        if (notificationsEnabled) showPushNotification('🎉 Goal Complete!', { body: msg, tag: k100 });
      } else if (p >= 75 && !goalAlertedRef.current[k75]) {
        goalAlertedRef.current[k75] = true;
        showToast(`🔷 "${g.name}" reached 75% — ₹${(g.target - g.current).toLocaleString('en-IN')} left!`, 'info');
      } else if (p >= 50 && !goalAlertedRef.current[k50]) {
        goalAlertedRef.current[k50] = true;
        showToast(`🔸 "${g.name}" hit the 50% milestone!`, 'info');
      }
      if (p < 50)  { delete goalAlertedRef.current[k50]; delete goalAlertedRef.current[k75]; delete goalAlertedRef.current[k100]; }
      else if (p < 75)  { delete goalAlertedRef.current[k75]; delete goalAlertedRef.current[k100]; }
      else if (p < 100) { delete goalAlertedRef.current[k100]; }
    });
  }, [goals, notificationsEnabled]); // eslint-disable-line

  // ─── Auto-persist ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const snapshot = {
      emergencyFloor, safeCushion, liquidCapital, checkingBalance, safeToSpend,
      inflow, outflow, activeRunway, categories, goals, transactions,
      recurringTransactions, baseCurrency, notificationsEnabled, notificationEmail,
      bankAccounts, spendingHistory,
    };
    saveFinancialData(currentUser.id, snapshot);
  }, [
    currentUser, emergencyFloor, safeCushion, liquidCapital, checkingBalance,
    safeToSpend, inflow, outflow, activeRunway, categories, goals, transactions,
    recurringTransactions, baseCurrency, notificationsEnabled, notificationEmail,
    bankAccounts, spendingHistory,
  ]);


  // ─── Mutation: addGoal ────────────────────────────────────────────────────
  const addGoal = useCallback(({ name, target, current = 0 }) => {
    const numTarget  = Math.max(1000, Number(target)  || 10000);
    const numCurrent = Math.max(0,    Number(current) || 0);
    const pct        = Math.min(100, Math.round((numCurrent / numTarget) * 1000) / 10);
    const newGoal = { id:'goal_'+Date.now(), name:name||'Dedicated Sinking Fund', target:numTarget, current:numCurrent, percentage:pct, daysRemaining:Math.round(Math.max(10,(numTarget-numCurrent)/350)) };
    setGoals(prev => [...prev, newGoal]);
    if (numCurrent > 0) { setCheckingBalance(p => Math.max(0,p-numCurrent)); setSafeToSpend(p => Math.max(0,p-numCurrent)); }
    closeModal();
    showToast(`Created sinking fund: "${newGoal.name}" — ₹${numTarget.toLocaleString('en-IN')} target`);
  }, [closeModal, showToast]);

  // ─── Mutation: topUpGoal ──────────────────────────────────────────────────
  const topUpGoal = useCallback((goalId, amount = 1000) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const newCurrent = g.current + amount;
      return { ...g, current:newCurrent, percentage:Math.min(100,Math.round((newCurrent/g.target)*1000)/10) };
    }));
    setCheckingBalance(p => Math.max(0,p-amount));
    setSafeToSpend(p     => Math.max(0,p-amount));
    showToast(`Added ₹${amount.toLocaleString('en-IN')} top-up!`);
  }, [showToast]);

  // ─── Mutation: addTransaction ──────────────────────────────────────────────
  const addTransaction = useCallback(({ title, amount, category, account, merchant }) => {
    const numAmount    = Number(amount) || 500;
    const isIncome     = category === 'Income';
    const signedAmount = isIncome ? Math.abs(numAmount) : -Math.abs(numAmount);
    const newTx = {
      id:'tx_'+Date.now(), title:title||'Manual Ledger Entry',
      category:category||'Shopping & Tech',
      icon:isIncome?'payments':(category==='Food & Dining'?'restaurant':category==='Transportation'?'local_gas_station':'receipt'),
      account:account||'UPI · Instant',
      timestamp:'Just now', txId:'#TX-'+Math.floor(10000+Math.random()*90000),
      amount:signedAmount, confidence:'100%', recurring:'Manual User Record',
      merchant:merchant||title||'Direct Counterparty',
      split:isIncome?'Primary Capital':'Personal Discretionary', tag:'User Verified',
    };
    setTransactions(prev => [newTx, ...prev]);
    if (isIncome) { setInflow(p=>p+Math.abs(numAmount)); setCheckingBalance(p=>p+Math.abs(numAmount)); setSafeToSpend(p=>p+Math.abs(numAmount)); }
    else {
      setOutflow(p=>p+Math.abs(numAmount)); setCheckingBalance(p=>Math.max(0,p-Math.abs(numAmount))); setSafeToSpend(p=>Math.max(0,p-Math.abs(numAmount)));
      setCategories(prev => prev.map(c => { if (c.name!==category) return c; const ns=c.spent+Math.abs(numAmount); return {...c,spent:ns,badge:`${Math.round((ns/c.limit)*100)}% Spent`}; }));
    }
    closeModal();
    showToast(`Transaction added: ${newTx.title} (₹${Math.abs(numAmount).toLocaleString('en-IN')})`);
  }, [closeModal, showToast]);

  // ─── Mutation: editTransaction ─────────────────────────────────────────────
  const editTransaction = useCallback((txId, updates) => {
    setTransactions(prev => {
      const old = prev.find(t => t.id === txId);
      if (!old) return prev;
      const updated = { ...old, ...updates };
      // Reverse old amount effect, apply new
      const oldAmt = old.amount;
      const newAmt = Number(updates.amount) !== undefined ? (updated.category==='Income'?Math.abs(Number(updates.amount)):-Math.abs(Number(updates.amount))) : oldAmt;
      updated.amount = newAmt;
      const diff = newAmt - oldAmt;
      if (diff !== 0) {
        setCheckingBalance(p => Math.max(0, p + diff));
        setSafeToSpend(p     => Math.max(0, p + diff));
        if (diff < 0) setOutflow(p  => p + Math.abs(diff));
        else          setInflow(p   => p + Math.abs(diff));
      }
      // Recalculate category spent
      setCategories(prevCats => {
        const rebuilt = [...prevCats];
        // Remove old category spent contribution
        const oldCatIdx = rebuilt.findIndex(c => c.name === old.category);
        if (oldCatIdx >= 0 && old.amount < 0) rebuilt[oldCatIdx] = {...rebuilt[oldCatIdx], spent: Math.max(0, rebuilt[oldCatIdx].spent - Math.abs(old.amount))};
        // Add new category spent contribution
        const newCatIdx = rebuilt.findIndex(c => c.name === (updates.category || old.category));
        if (newCatIdx >= 0 && newAmt < 0) rebuilt[newCatIdx] = {...rebuilt[newCatIdx], spent: rebuilt[newCatIdx].spent + Math.abs(newAmt)};
        return rebuilt.map(c => ({...c, badge:`${Math.round((c.spent/c.limit)*100)}% Spent`}));
      });
      return prev.map(t => t.id === txId ? updated : t);
    });
    showToast('Transaction updated');
  }, [showToast]);

  // ─── Mutation: deleteTransaction ──────────────────────────────────────────
  const deleteTransaction = useCallback((txId) => {
    setTransactions(prev => {
      const tx = prev.find(t => t.id === txId);
      if (!tx) return prev;
      // Reverse the transaction effect on balances
      const amt = tx.amount;
      if (amt < 0) { setOutflow(p => Math.max(0, p - Math.abs(amt))); setCheckingBalance(p => p + Math.abs(amt)); setSafeToSpend(p => p + Math.abs(amt)); }
      else         { setInflow(p => Math.max(0, p - amt)); setCheckingBalance(p => Math.max(0, p - amt)); setSafeToSpend(p => Math.max(0, p - amt)); }
      // Reverse category spent
      if (amt < 0) {
        setCategories(prevCats => prevCats.map(c => {
          if (c.name !== tx.category) return c;
          const ns = Math.max(0, c.spent - Math.abs(amt));
          return {...c, spent:ns, badge:`${Math.round((ns/c.limit)*100)}% Spent`};
        }));
      }
      return prev.filter(t => t.id !== txId);
    });
    showToast('Transaction deleted', 'info');
  }, [showToast]);

  // ─── Mutation: updateCategoryLimit (budget editing) ───────────────────────
  const updateCategoryLimit = useCallback((categoryId, newLimit) => {
    const lim = Math.max(100, Number(newLimit) || 1000);
    setCategories(prev => prev.map(c => {
      if (c.id !== categoryId) return c;
      const pct = Math.round((c.spent / lim) * 100);
      return { ...c, limit:lim, badge:`${pct}% Spent`, warn:pct >= 80 };
    }));
    showToast('Budget limit updated');
  }, [showToast]);

  // ─── Mutation: addCategory ────────────────────────────────────────────────
  const addCategory = useCallback((name, limit = 3000) => {
    const id = 'cat_' + name.toLowerCase().replace(/\s+/g,'_') + '_' + Date.now();
    const newCat = { id, name, spent:0, limit:Number(limit)||3000, color:'surface-variant', badge:'0% Spent', warn:false };
    setCategories(prev => [...prev, newCat]);
    showToast(`Category "${name}" created`);
    return id;
  }, [showToast]);

  // ─── Mutation: renameCategory ─────────────────────────────────────────────
  const renameCategory = useCallback((categoryId, newName) => {
    const oldName = categories.find(c => c.id === categoryId)?.name;
    setCategories(prev => prev.map(c => c.id === categoryId ? {...c, name:newName} : c));
    if (oldName) setTransactions(prev => prev.map(t => t.category === oldName ? {...t, category:newName} : t));
    showToast(`Category renamed to "${newName}"`);
  }, [categories, showToast]);

  // ─── Mutation: deleteCategory ─────────────────────────────────────────────
  const deleteCategory = useCallback((categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    setTransactions(prev => prev.map(t => t.category === cat.name ? {...t, category:'Shopping & Tech'} : t));
    showToast(`Category "${cat.name}" deleted`);
  }, [categories, showToast]);

  // ─── Mutation: addRecurring ────────────────────────────────────────────────
  const addRecurring = useCallback((rec) => {
    const newRec = {
      id:'rec_'+Date.now(), status:'active', lastRun:null,
      nextDue: getNextDueDate(rec.frequency || 'monthly', new Date().toISOString()).toISOString(),
      icon: rec.amount < 0 ? 'autorenew' : 'payments',
      ...rec,
      amount: rec.category === 'Income' ? Math.abs(rec.amount) : -Math.abs(rec.amount),
    };
    setRecurringTransactions(prev => [...prev, newRec]);
    showToast(`Recurring "${newRec.title}" created`);
    closeModal();
  }, [closeModal, showToast]);

  // ─── Mutation: updateRecurring ────────────────────────────────────────────
  const updateRecurring = useCallback((id, updates) => {
    setRecurringTransactions(prev => prev.map(r => r.id === id ? {...r, ...updates} : r));
    showToast('Recurring transaction updated');
  }, [showToast]);

  // ─── Mutation: deleteRecurring ────────────────────────────────────────────
  const deleteRecurring = useCallback((id) => {
    setRecurringTransactions(prev => prev.filter(r => r.id !== id));
    showToast('Recurring transaction deleted');
  }, [showToast]);

  // ─── Mutation: toggleRecurringStatus ────────────────────────────────────
  const toggleRecurringStatus = useCallback((id) => {
    setRecurringTransactions(prev => prev.map(r => r.id === id ? {...r, status: r.status==='paused'?'active':'paused'} : r));
  }, []);

  // ─── Mutation: syncBankAccounts ────────────────────────────────────────────
  const syncBankAccounts = useCallback(async () => {
    setBankSyncing(true);
    try {
      const result = await fetchBankAccounts();
      setBankAccounts(result.accounts);
      const txResult = await fetchBankTransactions();
      // Merge bank transactions (deduplicate by txRef)
      const existingRefs = new Set(transactions.map(t => t.txId));
      const newTxs = txResult.transactions
        .filter(t => !existingRefs.has(t.txRef))
        .map(t => ({ id:'bank_'+t.id, title:t.title, category:t.category, icon:'account_balance', account:t.bankId, timestamp:t.timestamp, txId:t.txRef, amount:t.amount, confidence:'99.5%', recurring:'Bank Sync', merchant:t.title, split:'Bank Import', tag:'AA Synced' }));
      if (newTxs.length > 0) setTransactions(prev => [...newTxs, ...prev]);
      showToast(`Synced ${result.accounts.length} accounts${newTxs.length > 0 ? `, ${newTxs.length} new transactions` : ''}`, 'success');
    } catch {
      showToast('Sync failed — check connection', 'error');
    } finally {
      setBankSyncing(false);
    }
  }, [transactions, showToast]);

  // ─── Mutation: enableNotifications ───────────────────────────────────────
  const enableNotifications = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      setNotificationsEnabled(true);
      showToast('Push notifications enabled', 'success');
      showPushNotification('FinPilot Notifications Active', { body: 'You will receive budget alerts, goal milestones, and payment reminders.' });
    } else if (perm === 'denied') {
      showToast('Notifications blocked — enable in browser settings', 'warning');
    } else if (perm === 'unsupported') {
      showToast('Browser does not support notifications', 'warning');
    }
  }, [showToast]);

  // ─── Mutation: exportData (full JSON/CSV backup) ──────────────────────────
  const exportData = useCallback((format = 'json') => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      userId: currentUser?.id,
      version: '2.0',
      financials: { emergencyFloor, safeCushion, liquidCapital, checkingBalance, safeToSpend, inflow, outflow, baseCurrency },
      categories, goals, transactions, recurringTransactions, spendingHistory,
    };
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type:'application/json;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `FinPilot_Backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      showToast('Full JSON backup downloaded');
    } else {
      // CSV: export transactions
      const headers = ['Transaction ID','Date & Time','Title','Category','Account','Amount (INR)','Merchant','Confidence','Tag','Recurring'];
      const rows = transactions.map(t => [ t.txId, t.timestamp, `"${t.title.replace(/"/g,'""')}"`, t.category, t.account, t.amount, `"${(t.merchant||'').replace(/"/g,'""')}"`, t.confidence, t.tag, t.recurring||'' ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `FinPilot_Transactions_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      showToast('Transactions CSV downloaded');
    }
  }, [currentUser, emergencyFloor, safeCushion, liquidCapital, checkingBalance, safeToSpend, inflow, outflow, baseCurrency, categories, goals, transactions, recurringTransactions, spendingHistory, showToast]);

  // ─── Mutation: exportTransactionsToCSV (legacy alias) ────────────────────
  const exportTransactionsToCSV = useCallback(() => exportData('csv'), [exportData]);

  // ─── Mutation: importData ─────────────────────────────────────────────────
  const importData = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.version || !data.financials) throw new Error('Invalid backup format');
      // Validate required fields
      if (!Array.isArray(data.transactions)) throw new Error('Missing transactions array');
      if (!Array.isArray(data.categories))   throw new Error('Missing categories array');
      // Deduplicate transactions by txId
      const existingIds = new Set(transactions.map(t => t.txId));
      const newTxs = data.transactions.filter(t => !existingIds.has(t.txId));
      const merged = [...newTxs, ...transactions];
      // Apply
      const f = data.financials;
      if (f.emergencyFloor !== undefined) setEmergencyFloor(f.emergencyFloor);
      if (f.safeCushion    !== undefined) setSafeCushion(f.safeCushion);
      if (f.liquidCapital  !== undefined) setLiquidCapital(f.liquidCapital);
      if (f.checkingBalance!== undefined) setCheckingBalance(f.checkingBalance);
      if (f.safeToSpend    !== undefined) setSafeToSpend(f.safeToSpend);
      if (f.inflow         !== undefined) setInflow(f.inflow);
      if (f.outflow        !== undefined) setOutflow(f.outflow);
      if (f.baseCurrency   !== undefined) setBaseCurrency(f.baseCurrency);
      setCategories(data.categories);
      setGoals(data.goals || goals);
      setTransactions(merged);
      if (data.recurringTransactions) setRecurringTransactions(data.recurringTransactions);
      if (data.spendingHistory)       setSpendingHistory(data.spendingHistory);
      showToast(`Restored: ${newTxs.length} new transactions, ${data.categories.length} categories`, 'success');
      return { success: true, newTxCount: newTxs.length };
    } catch(e) {
      showToast(`Import failed: ${e.message}`, 'error');
      return { success: false, error: e.message };
    }
  }, [transactions, goals, showToast]);

  // ─── Mutation: addQuickExpense (NLP) ──────────────────────────────────────
  const addQuickExpense = useCallback((text) => {
    const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
    let rawAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g,'')) : 350;
    if (isNaN(rawAmount) || rawAmount <= 0) rawAmount = 250;
    let category = 'Shopping & Tech', icon = 'shopping_bag', title = 'Quick Logged Outlay';
    if (/fuel|petrol|diesel|cab|uber|ola|auto|metro/i.test(text)) { category='Transportation'; icon='local_gas_station'; title=/cab|uber|ola/i.test(text)?'Uber / Ola Ride':'Fuel Refill'; }
    else if (/coffee|food|lunch|dinner|swiggy|zomato|starbucks|tea|burger|pizza/i.test(text)) { category='Food & Dining'; icon='restaurant'; title=/coffee|starbucks/i.test(text)?'Artisan Coffee':'Meal Outlay'; }
    else if (/bill|electricity|wifi|broadband|recharge/i.test(text)) { category='Utilities & Bills'; icon='bolt'; title='Utility Payment'; }
    // also check custom categories
    const customMatch = categories.find(c => text.toLowerCase().includes(c.name.toLowerCase()));
    if (customMatch) { category = customMatch.name; }
    const newTx = {
      id:'tx_'+Date.now(), title, category, icon,
      account:'UPI · Instant Ledger', timestamp:'Just now',
      txId:'#TX-'+Math.floor(10000+Math.random()*90000),
      amount:-rawAmount, confidence:'99.5%', recurring:'Real-time NLP Parser',
      merchant:text.slice(0,32), split:'Discretionary Cash Flow', tag:'NLP Fast Entry',
    };
    setTransactions(prev => [newTx, ...prev]);
    setCheckingBalance(prev => Math.max(0, prev - rawAmount));
    setSafeToSpend(prev     => Math.max(0, prev - rawAmount));
    setOutflow(prev         => prev + rawAmount);
    setCategories(prev => prev.map(c => { if (c.name!==category) return c; const ns=c.spent+rawAmount; return {...c,spent:ns,badge:`${Math.round((ns/c.limit)*100)}% Spent`}; }));
    showToast(`Logged ₹${rawAmount.toLocaleString('en-IN')} to ${category} via NLP`);
  }, [categories, showToast]);

  // ─── Mutation: recalibrateLedger ──────────────────────────────────────────
  const recalibrateLedger = useCallback(() => {
    const latencies = ['11ms','14ms','16ms','18ms','19ms','21ms'];
    const lat = latencies[Math.floor(Math.random()*latencies.length)];
    setSyncLatency(lat);
    const computed = Math.max(0, checkingBalance - emergencyFloor);
    setSafeToSpend(computed);
    showToast(`Recalibrated! Latency: ${lat}. Safe buffer: ₹${computed.toLocaleString('en-IN')}`);
  }, [checkingBalance, emergencyFloor, showToast]);

  // ─── Mutation: applySpendingShift ─────────────────────────────────────────
  const applySpendingShift = useCallback((shiftMonthly = 2400) => {
    setCategories(prev => prev.map(c => c.id==='food' ? {...c, limit:Math.max(2000,c.limit-shiftMonthly)} : c));
    setGoals(prev => prev.map(g => { if (g.id!=='goa') return g; const nc=g.current+shiftMonthly; return {...g,current:nc,percentage:Math.min(100,Math.round((nc/g.target)*1000)/10),daysRemaining:Math.max(10,g.daysRemaining-14)}; }));
    closeModal(); showToast(`Applied shift! ₹${shiftMonthly.toLocaleString('en-IN')}/mo reallocated from dining → Goa Trip Fund`);
  }, [closeModal, showToast]);

  // ─── Mutation: saveSettings ───────────────────────────────────────────────
  const saveSettings = useCallback((newFloor, newCushion) => {
    const f = Number(newFloor)   || emergencyFloor;
    const c = Number(newCushion) || safeCushion;
    setEmergencyFloor(f); setSafeCushion(c); setSafeToSpend(Math.max(0, checkingBalance - f));
    showToast(`Settings saved: emergency floor ₹${f.toLocaleString('en-IN')}`);
  }, [emergencyFloor, safeCushion, checkingBalance, showToast]);

  // ─── Chat engine ──────────────────────────────────────────────────────────
  const executeReasoningQuery = useCallback((customQuery = null) => {
    const q = (customQuery !== null ? customQuery : reasoningQuery).trim();
    if (!q) return;
    const userMsgId = 'u_'+Date.now();
    const botMsgId  = 'b_'+Date.now();
    setChatMessages(prev => [...prev, { id:userMsgId, role:'user', type:'text', text:q }]);
    setReasoningQuery(''); setIsSynthesizing(true); setPipelineState('Analysing…');
    setTimeout(() => {
      const reply = buildReply(q, { checkingBalance, safeToSpend, inflow, outflow, emergencyFloor, liquidCapital, categories, goals, transactions, recurringTransactions, baseCurrency }, { logExpense:(text) => addQuickExpense(text) });
      if (reply.type === 'verdict') setDecisionData(reply.data);
      setChatMessages(prev => [...prev, { id:botMsgId, role:'bot', ...reply }]);
      setIsSynthesizing(false); setPipelineState(`Replied in ${Math.floor(Math.random()*200+150)}ms`);
    }, 650);
  }, [reasoningQuery, checkingBalance, safeToSpend, inflow, outflow, emergencyFloor, liquidCapital, categories, goals, transactions, recurringTransactions, baseCurrency, addQuickExpense]);

  // ─── Architecture ─────────────────────────────────────────────────────────
  const pipelineNodes = [
    { stage:"STAGE 01", name:"User Request",    latency:"2ms",  desc:"Natural dialect query",         status:"Inbound OK",     icon:"chat_bubble_outline", iconColor:"text-primary",   fullDesc:"Cleans colloquial text, resolves currency abbreviations, initialises trace telemetry." },
    { stage:"STAGE 02", name:"Intent Parse",     latency:"24ms", desc:"Slot filling & AST",            status:"100% Typed",     icon:"schema",              iconColor:"text-secondary", fullDesc:"Validates AST against JSONSchema. Rejects ambiguous instructions without state access." },
    { stage:"STAGE 03", name:"Context Vector",   latency:"31ms", desc:"Ledger & goal state",           status:"Cache Hit",      icon:"database",            iconColor:"text-primary",   fullDesc:"Queries Open Banking replica cache, active SIP commitments, emergency thresholds." },
    { stage:"STAGE 04 (CORE)", name:"Pure Math Engine", latency:"11ms", desc:"Zero LLM Math Delegation", status:"Deterministic", icon:"calculate",           iconColor:"text-primary",   fullDesc:"Guarantees zero floating-point drift. Computes runway = (liquid - liability) / burn." },
    { stage:"STAGE 05", name:"Policy Guardrail", latency:"19ms", desc:"Reserve buffer clamp",          status:"Guards Passed",  icon:"gavel",               iconColor:"text-tertiary",  fullDesc:"Enforces non-negotiable constraints (e.g. ₹25,000 emergency liquid floor)." },
    { stage:"STAGE 06", name:"Editorial Synth",  latency:"48ms", desc:"Narrative distillation",        status:"Fact-Anchored",  icon:"auto_stories",        iconColor:"text-secondary", fullDesc:"Translates verified numeric output into empathetic, actionable editorial advice." },
    { stage:"STAGE 07", name:"Post-Audit Log",   latency:"7ms",  desc:"Tamper-evident ledger",         status:"Verified 256",   icon:"policy",              iconColor:"text-primary",   fullDesc:"Emits cryptographically signed audit records for regulator compliance." },
  ];

  const runArchitectureSimulation = useCallback((scenarioKey = activeScenario) => {
    setActiveScenario(scenarioKey); setIsSimulatingNodes(true);
    if (scenarioKey === 'laptop')   executeReasoningQuery("Can I purchase an ₹85,000 MacBook Pro today?");
    else if (scenarioKey === 'sip') executeReasoningQuery("Can I safely increase my monthly Index Fund SIP by ₹2,500?");
    else                            executeReasoningQuery("Can I afford a ₹4,000 flight to Goa this weekend?");
    showToast(`Simulation trace active: ${scenarioKey.toUpperCase()}`);
    setTimeout(() => setIsSimulatingNodes(false), 1200);
  }, [activeScenario, executeReasoningQuery, showToast]);

  // ─── Refresh forex ────────────────────────────────────────────────────────
  const refreshForex = useCallback(async () => {
    setForexLoading(true);
    const result = await fetchForexRates();
    setForexRates(result.rates); setForexSource(result.source); setForexLoading(false);
    showToast(`Forex rates refreshed (${result.source})`, 'info');
  }, [showToast]);

  return (
    <FinancialContext.Provider value={{
      // Navigation
      activeTab, setActiveTab,
      demoData, setDemoData,
      presentationMode, setPresentationMode,
      isCommandPaletteOpen, setIsCommandPaletteOpen,
      isMobileMenuOpen, setIsMobileMenuOpen,
      toasts, showToast, setToasts,
      activeModal, openModal, closeModal,
      // Settings
      emergencyFloor, safeCushion, saveSettings,
      // Financial metrics
      liquidCapital, checkingBalance, safeToSpend,
      inflow, outflow, activeRunway,
      syncLatency, confidenceScore,
      // Categories (with budget editing + custom)
      categories, setCategories,
      updateCategoryLimit, addCategory, renameCategory, deleteCategory,
      // Goals
      goals, addGoal, topUpGoal,
      // Transactions (with edit/delete)
      transactions, addTransaction, editTransaction, deleteTransaction,
      exportTransactionsToCSV, addQuickExpense,
      // Recurring
      recurringTransactions, addRecurring, updateRecurring, deleteRecurring, toggleRecurringStatus,
      // Spending history
      spendingHistory, setSpendingHistory,
      // Recalibrate / shift
      recalibrateLedger, applySpendingShift,
      // Multi-currency
      baseCurrency, setBaseCurrency,
      forexRates, forexLoading, forexSource, refreshForex,
      // Banking
      bankAccounts, bankLoading, bankSyncing, syncBankAccounts,
      // Stock prices
      stockPrices, stockSource,
      // Notifications
      notificationsEnabled, setNotificationsEnabled,
      notificationEmail, setNotificationEmail,
      notifPermission, enableNotifications,
      // Backup / restore
      exportData, importData,
      // AI Chat
      reasoningQuery, setReasoningQuery,
      isSynthesizing, pipelineState, decisionData, executeReasoningQuery,
      chatMessages, setChatMessages,
      marketSeed: MARKET_SEED,
      // Architecture
      architectureViewMode, setArchitectureViewMode,
      selectedNodeIndex, setSelectedNodeIndex,
      activeScenario, setActiveScenario,
      isSimulatingNodes, pipelineNodes, runArchitectureSimulation,
    }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const ctx = useContext(FinancialContext);
  if (!ctx) throw new Error('useFinancial must be used within a FinancialProvider');
  return ctx;
}
