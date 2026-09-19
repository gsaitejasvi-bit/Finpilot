import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../context/FinancialContext';

// Tick prices slightly on each render cycle so they feel "live"
function useLivePrices(stocks) {
  const [prices, setPrices] = useState(() => {
    const init = {};
    Object.keys(stocks).forEach(k => { init[k] = stocks[k].price; });
    return init;
  });

  useEffect(() => {
    const id = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        Object.keys(stocks).forEach(k => {
          const base  = stocks[k].price;
          const noise = (Math.random() - 0.49) * base * 0.002;
          next[k] = Math.round((prev[k] + noise) * 100) / 100;
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [stocks]);

  return prices;
}

const VERDICT_STYLE = {
  BUY:  { bg:'#deedc8', text:'#1a2900', border:'#c4db9e', dot:'#5a6e3a', emoji:'✅' },
  WAIT: { bg:'#faecd3', text:'#3d2800', border:'#f0d5a8', dot:'#9e6c2a', emoji:'🟡' },
  SKIP: { bg:'#f5d5d5', text:'#5c0e0e', border:'#f0b8b8', dot:'#9b2c2c', emoji:'❌' },
};

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 65 ? '#5a6e3a' : pct >= 45 ? '#9e6c2a' : '#9b2c2c';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#ede0d0' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-label-sm shrink-0" style={{ color, fontSize: '0.65rem', fontFamily: 'JetBrains Mono' }}>
        {pct}%
      </span>
    </div>
  );
}

function StockRow({ symbol, stock, livePrice }) {
  const vs    = VERDICT_STYLE[stock.rec] ?? VERDICT_STYLE.WAIT;
  const prev  = stock.price;
  const diff  = livePrice - prev;
  const diffPct = ((diff / prev) * 100).toFixed(2);
  const isUp  = diff >= 0;

  return (
    <div className="grid items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
      style={{ background: '#fffdf9', border: '1px solid #ede0d0', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>

      {/* Name */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-semibold truncate" style={{ color: '#2c1f0e', fontSize: '0.8rem' }}>{stock.name}</span>
        <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.62rem' }}>
          {symbol} · {stock.sector}
        </span>
      </div>

      {/* Live price */}
      <span className="font-semibold text-right" style={{ color: '#2c1f0e', fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
        ₹{livePrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </span>

      {/* Change */}
      <div className="flex items-center justify-end gap-1">
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: isUp ? '#5a6e3a' : '#9b2c2c' }}>
          {isUp ? 'arrow_upward' : 'arrow_downward'}
        </span>
        <span className="font-label-md" style={{ color: isUp ? '#5a6e3a' : '#9b2c2c', fontSize: '0.7rem' }}>
          {isUp ? '+' : ''}{diffPct}%
        </span>
      </div>

      {/* P/E */}
      <span className="text-center font-label-sm" style={{ color: '#6b4f35', fontSize: '0.68rem', fontFamily: 'JetBrains Mono' }}>
        {stock.pe ?? 'N/A'}
      </span>

      {/* Verdict */}
      <div className="flex items-center justify-end">
        <span className="px-2 py-0.5 rounded-full font-label-sm font-semibold"
          style={{ background: vs.bg, color: vs.text, border: `1px solid ${vs.border}`, fontSize: '0.62rem' }}>
          {vs.emoji} {stock.rec}
        </span>
      </div>
    </div>
  );
}

function IPORow({ ipo }) {
  const vs = VERDICT_STYLE[ipo.verdict] ?? VERDICT_STYLE.WAIT;
  const statusColor = ipo.status === 'upcoming' ? '#9e6c2a'
    : ipo.status === 'open' ? '#5a6e3a' : '#a0846a';

  return (
    <div className="rounded-xl p-3 flex flex-col gap-2"
      style={{ background: '#fffdf9', border: '1px solid #ede0d0' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold truncate" style={{ color: '#2c1f0e', fontSize: '0.82rem' }}>{ipo.name}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label-sm px-2 py-0.5 rounded-full"
              style={{ background: '#f7f0e6', color: statusColor, border: '1px solid #d9c9b0', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>
              {ipo.status}
            </span>
            <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.65rem' }}>
              {ipo.open} – {ipo.close}
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full font-label-sm font-bold shrink-0"
          style={{ background: vs.bg, color: vs.text, border: `1px solid ${vs.border}`, fontSize: '0.65rem' }}>
          {vs.emoji} {ipo.verdict}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {[
          ['Price Band', ipo.band],
          ['Grey Mkt Premium', ipo.gmp],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center gap-1">
            <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.62rem' }}>{k}:</span>
            <span className="font-label-md font-semibold" style={{ color: '#2c1f0e', fontSize: '0.7rem' }}>{v}</span>
          </div>
        ))}
      </div>

      <ConfidenceBar value={ipo.conf} />

      <p className="font-body-sm" style={{ color: '#6b4f35', fontSize: '0.72rem', lineHeight: 1.5 }}>
        {ipo.reason}
      </p>
    </div>
  );
}

export default function MarketResearch() {
  const { marketSeed, executeReasoningQuery } = useFinancial();
  const [tab,    setTab]    = useState('stocks');
  const [search, setSearch] = useState('');
  const livePrices = useLivePrices(marketSeed.stocks);

  const filteredStocks = Object.entries(marketSeed.stocks).filter(([sym, s]) =>
    !search || sym.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIPOs = marketSeed.ipos.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  const nifty   = marketSeed.stocks['NIFTY50'];
  const sensex  = marketSeed.stocks['SENSEX'];
  const nLive   = livePrices['NIFTY50'] ?? nifty.price;
  const sLive   = livePrices['SENSEX']  ?? sensex.price;

  function askAbout(name) {
    executeReasoningQuery(`Tell me about ${name}`);
  }

  return (
    <div className="widget flex flex-col animate-float-up" style={{ animationDelay: '80ms' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ borderBottom: '1px solid #d9c9b0' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#2c1f0e,#4a3318)' }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#f3dcc0' }}>candlestick_chart</span>
          </div>
          <div>
            <span className="font-semibold block"
              style={{ color: '#2c1f0e', fontFamily: "'Playfair Display',serif", fontSize: '0.95rem' }}>
              Market Research
            </span>
            <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.6rem' }}>
              Live quotes · IPO tracker · BUY/WAIT/SKIP verdicts
            </span>
          </div>
        </div>

        {/* Index pills */}
        <div className="flex items-center gap-2">
          {[
            { label:'NIFTY', live:nLive, base:nifty.price, change:nifty.change },
            { label:'SENSEX', live:sLive, base:sensex.price, change:sensex.change },
          ].map(idx => {
            const isUp = idx.change >= 0;
            return (
              <div key={idx.label} className="flex flex-col items-end px-2.5 py-1.5 rounded-xl"
                style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
                <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.58rem' }}>{idx.label}</span>
                <span className="font-semibold" style={{ color: '#2c1f0e', fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>
                  {idx.live.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span style={{ color: isUp ? '#5a6e3a' : '#9b2c2c', fontSize: '0.6rem', fontFamily: 'JetBrains Mono' }}>
                  {isUp ? '+' : ''}{idx.change}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid #d9c9b0' }}>
        {[
          { id:'stocks', label:'Stocks', icon:'show_chart' },
          { id:'ipos',   label:'IPO Tracker', icon:'rocket_launch' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-5 py-2.5 font-label-md font-semibold transition-all"
            style={{
              color:       tab === t.id ? '#7c4a1e' : '#a0846a',
              borderBottom: tab === t.id ? '2px solid #7c4a1e' : '2px solid transparent',
              background:  tab === t.id ? '#fffdf9' : 'transparent',
              marginBottom: '-1px',
              fontSize: '0.75rem',
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}

        {/* Search */}
        <div className="ml-auto flex items-center gap-1.5 px-3 my-1.5 mr-3 rounded-xl"
          style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#a0846a' }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-transparent outline-none font-body-sm"
            style={{ color: '#2c1f0e', width: 90, fontSize: '0.75rem' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ background: '#fdf8f2' }}>

        {tab === 'stocks' && (
          <>
            {/* Column headers */}
            <div className="grid px-3 gap-3" style={{ gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr' }}>
              {['Company', 'Price', 'Change', 'P/E', 'Verdict'].map(h => (
                <span key={h} className="font-label-sm text-right first:text-left"
                  style={{ color: '#a0846a', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </span>
              ))}
            </div>

            {filteredStocks.map(([sym, stock]) => (
              <div key={sym} onClick={() => askAbout(stock.name)} className="cursor-pointer">
                <StockRow symbol={sym} stock={stock} livePrice={livePrices[sym] ?? stock.price} />
              </div>
            ))}

            <p className="text-center font-label-sm mt-2" style={{ color: '#c9b49a', fontSize: '0.62rem' }}>
              Click any row to ask the AI about that stock · Prices refresh every 3s
            </p>
          </>
        )}

        {tab === 'ipos' && (
          <>
            <div className="flex items-center gap-2 px-1">
              {['upcoming','open','closed','listed'].map(s => {
                const cnt = marketSeed.ipos.filter(i => i.status === s).length;
                if (!cnt) return null;
                const color = s === 'open' ? '#5a6e3a' : s === 'upcoming' ? '#9e6c2a' : '#a0846a';
                return (
                  <span key={s} className="px-2.5 py-1 rounded-full font-label-sm"
                    style={{ background: '#f7f0e6', color, border: '1px solid #d9c9b0', fontSize: '0.65rem', fontWeight: 600 }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)} ({cnt})
                  </span>
                );
              })}
            </div>

            {filteredIPOs.map((ipo, i) => (
              <div key={i} onClick={() => askAbout(ipo.name + ' IPO')} className="cursor-pointer">
                <IPORow ipo={ipo} />
              </div>
            ))}

            <p className="text-center font-label-sm mt-2" style={{ color: '#c9b49a', fontSize: '0.62rem' }}>
              Click any IPO to ask the AI for a detailed verdict
            </p>
          </>
        )}
      </div>
    </div>
  );
}
