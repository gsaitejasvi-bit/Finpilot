import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

const CAT_COLORS = {
  'Food & Dining':    { bg: '#faecd3', icon: '#9e6c2a', bar: '#9e6c2a' },
  'Transportation':   { bg: '#deedc8', icon: '#5a6e3a', bar: '#5a6e3a' },
  'Shopping & Tech':  { bg: '#f3dcc0', icon: '#7c4a1e', bar: '#7c4a1e' },
  'Utilities & Bills':{ bg: '#e8ddd0', icon: '#6b4f35', bar: '#6b4f35' },
  'Income':           { bg: '#deedc8', icon: '#3d5420', bar: '#3d5420' },
};

export default function TransactionTimeline() {
  const { transactions, exportTransactionsToCSV } = useFinancial();
  const [expandedId, setExpandedId] = useState(transactions[0]?.id ?? null);

  return (
    <div className="widget p-space-lg flex flex-col gap-4 animate-float-up" style={{ animationDelay: '60ms' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f3dcc0,#e8c99a)' }}>
            <span className="material-symbols-outlined text-[17px]" style={{ color: '#7c4a1e' }}>receipt_long</span>
          </div>
          <div>
            <span className="font-headline-sm font-semibold block" style={{ color: '#2c1f0e' }}>Recent Transactions</span>
            <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.62rem' }}>Real-time enrichment</span>
          </div>
        </div>
        <button
          onClick={exportTransactionsToCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-label-sm font-semibold transition-all"
          style={{ background: '#f7f0e6', color: '#7c4a1e', border: '1px solid #d9c9b0' }}
          onMouseEnter={e => e.currentTarget.style.background = '#ede0d0'}
          onMouseLeave={e => e.currentTarget.style.background = '#f7f0e6'}
        >
          <span className="material-symbols-outlined text-[14px]">file_download</span>
          Export CSV
        </button>
      </div>

      {/* Transaction list */}
      <div className="flex flex-col gap-2">
        {transactions.map((tx) => {
          const isExpanded = expandedId === tx.id;
          const isIncome   = tx.amount >= 0;
          const colors     = CAT_COLORS[tx.category] ?? { bg: '#f7f0e6', icon: '#6b4f35', bar: '#7c4a1e' };
          const formatted  = `${isIncome ? '+' : '-'} ₹${Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

          return (
            <div key={tx.id}
              onClick={() => setExpandedId(prev => prev === tx.id ? null : tx.id)}
              className="rounded-xl p-3 cursor-pointer transition-all flex flex-col gap-2"
              style={{
                background: isExpanded ? '#f7f0e6' : '#fffdf9',
                border: isExpanded ? '1px solid #d9c9b0' : '1px solid #ede0d0',
                boxShadow: isExpanded ? '0 2px 10px rgba(100,60,20,0.08)' : 'none',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Icon + title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: colors.bg }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: colors.icon }}>{tx.icon}</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body-md font-semibold truncate" style={{ color: '#2c1f0e' }}>{tx.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: colors.bg, color: colors.icon }}>{tx.category}</span>
                    </div>
                    <span className="font-label-sm" style={{ color: '#a0846a', fontSize: '0.65rem' }}>
                      {tx.timestamp} · {tx.account}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <span className="font-label-md font-bold block"
                    style={{ color: isIncome ? '#3d5420' : '#2c1f0e' }}>{formatted}</span>
                  <span className="font-label-sm"
                    style={{ color: tx.tag === 'NLP Fast Entry' ? '#5a6e3a' : '#a0846a', fontSize: '0.62rem' }}>
                    {tx.tag}
                  </span>
                </div>
              </div>

              {/* Expanded drawer */}
              {isExpanded && (
                <div className="rounded-xl p-3 flex flex-col gap-1.5 animate-fade-in"
                  style={{ background: '#ede0d0', border: '1px solid #d9c9b0' }}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-label-sm" style={{ fontSize: '0.68rem' }}>
                    {[
                      ['Confidence',  tx.confidence],
                      ['Recurring',   tx.recurring],
                      ['Merchant',    tx.merchant],
                      ['Split Tag',   tx.split],
                      ['Tx ID',       tx.txId],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-baseline gap-1">
                        <span style={{ color: '#a0846a' }}>{k}:</span>
                        <strong style={{ color: '#2c1f0e' }}>{v}</strong>
                      </div>
                    ))}
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
