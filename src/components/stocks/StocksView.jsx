import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { tickPrice } from '../../services/apiService';

const VERDICTS = { BUY: { bg: '#deedc8', color: '#3d5420', border: '#c4db9e' }, WAIT: { bg: '#faecd3', color: '#7c4a1e', border: '#e8c99a' }, SKIP: { bg: '#f5d5d5', color: '#9b2c2c', border: '#f0b8b8' } };

function ConfBar({ conf }) {
  const pct = Math.round(conf * 100);
  const color = pct >= 65 ? '#5a6e3a' : pct >= 45 ? '#9e6c2a' : '#9b2c2c';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#ede0d0' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-mono shrink-0" style={{ color, minWidth: 30 }}>{pct}%</span>
    </div>
  );
}

export default function StocksView() {
  const { marketSeed, executeReasoningQuery, stockPrices } = useFinancial();
  const [tab,    setTab]    = useState('stocks'); // stocks | ipos
  const [search, setSearch] = useState('');
  const [prices, setPrices] = useState({});

  // Live price tick every 4s
  useEffect(() => {
    const tick = () => {
      const p = {};
      Object.entries(marketSeed.stocks).forEach(([k, s]) => {
        p[k] = tickPrice(prices[k]?.price ?? s.price);
      });
      setPrices(p);
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  const filteredStocks = Object.entries(marketSeed.stocks).filter(([k, s]) =>
    !search || k.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()) || s.sector.toLowerCase().includes(search.toLowerCase())
  );
  const filteredIPOs = marketSeed.ipos.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.status.toLowerCase().includes(search.toLowerCase())
  );

  const nifty  = marketSeed.stocks['NIFTY50'];
  const sensex = marketSeed.stocks['SENSEX'];

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 gap-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: '#d9c9b0' }}>
        <div>
          <span className="uppercase tracking-widest font-semibold block" style={{ color: '#a0846a', fontSize: '0.62rem' }}>Live Market Research</span>
          <h1 className="font-bold" style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#2c1f0e' }}>Stocks & IPOs</h1>
        </div>
        {/* Market indices strip */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Nifty 50', price: prices['NIFTY50'] ?? nifty.price, change: nifty.change },
            { label: 'Sensex',   price: prices['SENSEX']  ?? sensex.price, change: sensex.change },
          ].map(m => (
            <div key={m.label} className="px-3 py-2 rounded-xl text-center widget" style={{ minWidth: 110 }}>
              <span className="text-xs block" style={{ color: '#a0846a' }}>{m.label}</span>
              <span className="font-bold text-sm font-mono block" style={{ color: '#2c1f0e' }}>
                {(m.price || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold" style={{ color: m.change >= 0 ? '#5a6e3a' : '#9b2c2c' }}>
                {m.change >= 0 ? '+' : ''}{m.change}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl self-start" style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
          {[{ id: 'stocks', label: 'Equities' }, { id: 'ipos', label: 'IPO Tracker' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={tab === t.id ? { background: '#7c4a1e', color: '#f3dcc0' } : { color: '#6b4f35' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border" style={{ background: '#f7f0e6', borderColor: '#d9c9b0', maxWidth: 280 }}>
          <span className="material-symbols-outlined text-[17px]" style={{ color: '#a0846a' }}>search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stocks, IPOs…"
            className="w-full bg-transparent outline-none text-sm" style={{ color: '#2c1f0e' }} />
        </div>
      </div>

      {/* ── Stocks table ───────────────────────────── */}
      {tab === 'stocks' && (
        <div className="widget overflow-hidden">
          <div className="grid text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border-b"
            style={{ color: '#a0846a', borderColor: '#d9c9b0', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr' }}>
            <span>Company</span><span className="text-right">Price</span><span className="text-right">Change</span>
            <span className="text-right">P/E</span><span className="text-right">Sector</span><span className="text-right">Verdict</span>
          </div>
          <div className="flex flex-col divide-y" style={{ divideColor: '#f0e6d8' }}>
            {filteredStocks.map(([key, s]) => {
              const live    = prices[key] ?? s.price;
              const v       = VERDICTS[s.rec] || VERDICTS.WAIT;
              const isUp    = s.change >= 0;
              return (
                <button
                  key={key}
                  onClick={() => executeReasoningQuery(`Tell me about ${s.name} stock`)}
                  className="grid w-full px-4 py-3 text-left transition-colors"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fdf8f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="flex flex-col justify-center">
                    <span className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>{s.name}</span>
                    <span className="text-xs font-mono" style={{ color: '#a0846a' }}>{key}</span>
                  </div>
                  <div className="text-right self-center">
                    <span className="font-bold text-sm font-mono" style={{ color: '#2c1f0e' }}>
                      ₹{live.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right self-center">
                    <span className="text-xs font-semibold font-mono px-1.5 py-0.5 rounded"
                      style={{ background: isUp ? '#deedc8' : '#f5d5d5', color: isUp ? '#3d5420' : '#9b2c2c' }}>
                      {isUp ? '+' : ''}{s.change}%
                    </span>
                  </div>
                  <div className="text-right self-center">
                    <span className="text-sm font-mono" style={{ color: '#6b4f35' }}>{s.pe ?? '—'}</span>
                  </div>
                  <div className="text-right self-center">
                    <span className="text-xs" style={{ color: '#a0846a' }}>{s.sector}</span>
                  </div>
                  <div className="text-right self-center flex flex-col gap-1 items-end">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}` }}>
                      {s.rec}
                    </span>
                    <div className="w-20">
                      <ConfBar conf={s.conf} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── IPO tracker ────────────────────────────── */}
      {tab === 'ipos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIPOs.map(ipo => {
            const v = VERDICTS[ipo.verdict] || VERDICTS.WAIT;
            const statusColors = {
              upcoming: { bg: '#faecd3', color: '#7c4a1e' },
              open:     { bg: '#deedc8', color: '#3d5420' },
              closed:   { bg: '#f7f0e6', color: '#6b4f35' },
              listed:   { bg: '#f5d5d5', color: '#9b2c2c' },
            };
            const sc = statusColors[ipo.status] || statusColors.closed;
            return (
              <button
                key={ipo.name}
                onClick={() => executeReasoningQuery(`${ipo.name} IPO verdict`)}
                className="widget p-5 text-left flex flex-col gap-3 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm" style={{ color: '#2c1f0e', lineHeight: 1.3 }}>{ipo.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                    style={{ background: sc.bg, color: sc.color }}>
                    {ipo.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: 'Price Band', v: ipo.band },
                    { l: 'GMP',        v: ipo.gmp  },
                    { l: 'Open',       v: ipo.open  },
                    { l: 'Close',      v: ipo.close },
                  ].map(f => (
                    <div key={f.l} className="rounded-lg p-2" style={{ background: '#f7f0e6' }}>
                      <span className="text-xs block" style={{ color: '#a0846a' }}>{f.l}</span>
                      <span className="text-xs font-semibold font-mono" style={{ color: '#2c1f0e' }}>{f.v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}` }}>
                    {ipo.verdict}
                  </span>
                  <ConfBar conf={ipo.conf} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#6b4f35' }}>{ipo.reason}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* API source note */}
      <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: '#f3dcc0', border: '1px solid #e8c99a' }}>
        <span className="material-symbols-outlined shrink-0" style={{ fontSize: 16, color: '#7c4a1e' }}>info</span>
        <span className="text-xs" style={{ color: '#7c4a1e' }}>
          Prices update every 4 seconds with ±0.3% mock tick. Add <code className="rounded px-1" style={{ background: 'rgba(124,74,30,0.15)' }}>VITE_ALPHA_VANTAGE_KEY</code> to .env for real NSE/BSE data via Alpha Vantage.
        </span>
      </div>
    </div>
  );
}
