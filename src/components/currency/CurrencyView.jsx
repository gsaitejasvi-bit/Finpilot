import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { CURRENCIES, convertFromINR, formatCurrency } from '../../services/apiService';

export default function CurrencyView() {
  const {
    baseCurrency, setBaseCurrency,
    forexRates, forexLoading, forexSource, refreshForex,
    checkingBalance, safeToSpend, liquidCapital, inflow, outflow,
    showToast,
  } = useFinancial();

  const [convertAmt,   setConvertAmt]   = useState('10000');
  const [convertFrom,  setConvertFrom]  = useState('INR');
  const [convertTo,    setConvertTo]    = useState('USD');
  const [open,         setOpen]         = useState(false);

  const rates    = forexRates || {};
  const meta     = CURRENCIES[baseCurrency] || CURRENCIES.INR;

  // Converter logic
  const fromRate = rates[convertFrom] ?? 1;
  const toRate   = rates[convertTo]   ?? 1;
  // First convert to INR, then to target
  const inINR    = convertFrom === 'INR' ? Number(convertAmt) : Number(convertAmt) / fromRate;
  const result   = convertTo   === 'INR' ? inINR              : inINR * toRate;

  const balances = [
    { label: 'Checking Balance',   inr: checkingBalance },
    { label: 'Safe to Spend',      inr: safeToSpend     },
    { label: 'Total Liquid Capital', inr: liquidCapital  },
    { label: 'Monthly Inflow',     inr: inflow          },
    { label: 'Monthly Outflow',    inr: outflow         },
  ];

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 gap-6 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: '#d9c9b0' }}>
        <div>
          <span className="uppercase tracking-widest font-semibold block" style={{ color: '#a0846a', fontSize: '0.62rem' }}>Forex & Currency</span>
          <h1 className="font-bold" style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#2c1f0e' }}>Multi-Currency</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{ background: forexSource === 'live' ? '#deedc8' : '#f3dcc0', color: forexSource === 'live' ? '#3d5420' : '#7c4a1e' }}>
            {forexLoading ? 'Updating…' : forexSource === 'live' ? '● Live rates' : '● Fallback rates'}
          </span>
          <button onClick={refreshForex}
            className="w-8 h-8 flex items-center justify-center rounded-xl border"
            style={{ background: '#f7f0e6', borderColor: '#d9c9b0', color: '#6b4f35' }}>
            <span className="material-symbols-outlined text-[16px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Base currency selector */}
      <div className="widget p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>Base Display Currency</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {Object.entries(CURRENCIES).map(([code, info]) => (
            <button
              key={code}
              onClick={() => { setBaseCurrency(code); showToast(`Base currency set to ${code}`); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left"
              style={
                baseCurrency === code
                  ? { background: '#7c4a1e', borderColor: '#7c4a1e', color: '#f3dcc0' }
                  : { background: '#f7f0e6', borderColor: '#d9c9b0', color: '#2c1f0e' }
              }
            >
              <span style={{ fontSize: '1.1rem' }}>{info.flag}</span>
              <div>
                <span className="font-semibold text-xs block">{code}</span>
                <span className="text-xs block truncate" style={{ opacity: 0.7, maxWidth: 60 }}>{info.name.split(' ')[0]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Currency converter */}
      <div className="widget p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>Currency Converter</h2>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 flex items-center gap-2 w-full">
            <input
              type="number"
              value={convertAmt}
              onChange={e => setConvertAmt(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl outline-none text-right font-mono font-bold text-lg"
              style={{ background: '#f7f0e6', border: '1px solid #d9c9b0', color: '#2c1f0e', minWidth: 0 }}
            />
            <select
              value={convertFrom}
              onChange={e => setConvertFrom(e.target.value)}
              className="px-3 py-2.5 rounded-xl outline-none font-semibold text-sm shrink-0"
              style={{ background: '#2c1f0e', color: '#f3dcc0', border: 'none' }}
            >
              {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
            style={{ background: '#f3dcc0', color: '#7c4a1e', fontWeight: 700, fontSize: '1.2rem' }}>
            →
          </div>

          <div className="flex-1 flex items-center gap-2 w-full">
            <div className="flex-1 px-3 py-2.5 rounded-xl font-mono font-bold text-lg text-right"
              style={{ background: '#deedc8', border: '1px solid #c4db9e', color: '#2c1f0e' }}>
              {isNaN(result) ? '—' : result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
            <select
              value={convertTo}
              onChange={e => setConvertTo(e.target.value)}
              className="px-3 py-2.5 rounded-xl outline-none font-semibold text-sm shrink-0"
              style={{ background: '#5a6e3a', color: '#fff', border: 'none' }}
            >
              {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs" style={{ color: '#a0846a' }}>
          Rate: 1 {convertFrom} = {convertFrom === 'INR' ? (rates[convertTo] ?? 0).toFixed(5) : ((rates[convertTo] ?? 1) / (rates[convertFrom] ?? 1)).toFixed(5)} {convertTo} · {forexSource === 'live' ? 'Live mid-market' : 'Approximate fallback rate'}
        </p>
      </div>

      {/* Your balances in all currencies */}
      <div className="widget p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>Your Balances in All Currencies</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="text-xs uppercase tracking-wider border-b" style={{ color: '#a0846a', borderColor: '#d9c9b0' }}>
                <th className="text-left py-2 pr-4">Metric</th>
                {Object.entries(CURRENCIES).slice(0, 6).map(([code, info]) => (
                  <th key={code} className="text-right py-2 px-2">
                    <span>{info.flag}</span> {code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ divideColor: '#f0e6d8' }}>
              {balances.map(b => (
                <tr key={b.label} className="transition-colors" onMouseEnter={e => e.currentTarget.style.background = '#fdf8f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="py-2.5 pr-4 font-medium" style={{ color: '#2c1f0e' }}>{b.label}</td>
                  {Object.keys(CURRENCIES).slice(0, 6).map(code => {
                    const converted = convertFromINR(b.inr, code, rates);
                    return (
                      <td key={code} className="text-right py-2.5 px-2 font-mono text-xs" style={{ color: '#6b4f35' }}>
                        {formatCurrency(converted, code)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate table */}
      <div className="widget p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>Exchange Rates (base: 1 INR)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {Object.entries(CURRENCIES).map(([code, info]) => (
            <div key={code} className="rounded-xl p-3 border" style={{ background: '#f7f0e6', borderColor: '#d9c9b0' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ fontSize: '1rem' }}>{info.flag}</span>
                <span className="font-semibold text-xs" style={{ color: '#2c1f0e' }}>{code}</span>
              </div>
              <span className="font-mono font-bold text-sm block" style={{ color: '#7c4a1e' }}>
                {code === 'INR' ? '1.0000' : (rates[code] ?? 0).toFixed(5)}
              </span>
              <span className="text-xs" style={{ color: '#a0846a' }}>{info.name}</span>
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#a0846a' }}>
          Add <code className="rounded px-1" style={{ background: '#ede0d0' }}>VITE_EXCHANGE_RATE_KEY</code> to .env for live rates via ExchangeRate-API. Rates refresh every hour.
        </p>
      </div>
    </div>
  );
}
