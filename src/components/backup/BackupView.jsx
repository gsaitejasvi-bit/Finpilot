import React, { useRef, useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function BackupView() {
  const {
    exportData, importData,
    transactions, categories, goals, recurringTransactions,
    showToast,
  } = useFinancial();

  const fileRef     = useRef(null);
  const [result,    setResult]    = useState(null);
  const [isDragOver,setIsDragOver]= useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.json')) { showToast('Please upload a FinPilot .json backup file', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => { const r = importData(e.target.result); setResult(r); if (r.success) setTimeout(()=>setResult(null), 5000); };
    reader.readAsText(file);
  };

  const stats = [
    { label: 'Transactions',   value: transactions.length,          icon: 'receipt_long',  color: '#7c4a1e', bg: '#f3dcc0' },
    { label: 'Categories',     value: categories.length,            icon: 'category',      color: '#5a6e3a', bg: '#deedc8' },
    { label: 'Goals',          value: goals.length,                 icon: 'flag',          color: '#9e6c2a', bg: '#faecd3' },
    { label: 'Recurring Rules', value: recurringTransactions.length, icon: 'autorenew',    color: '#6b4f35', bg: '#f7f0e6' },
  ];

  return (
    <div className="flex flex-col w-full px-4 sm:px-8 py-6 gap-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="border-b pb-4" style={{ borderColor: '#d9c9b0' }}>
        <span className="uppercase tracking-widest font-semibold block" style={{ color: '#a0846a', fontSize: '0.62rem' }}>Data Management</span>
        <h1 className="font-bold" style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: '#2c1f0e' }}>Backup & Restore</h1>
      </div>

      {/* Data snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="widget p-4 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: s.color }}>{s.icon}</span>
            </div>
            <span className="font-bold text-2xl" style={{ color: s.color, fontFamily: 'JetBrains Mono' }}>{s.value}</span>
            <span className="text-xs" style={{ color: '#a0846a' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Export */}
      <div className="widget p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#5a6e3a' }}>file_download</span>
          <h2 className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>Export Your Data</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Full JSON backup */}
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#5a6e3a' }}>data_object</span>
              <span className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>Full JSON Backup</span>
            </div>
            <p className="text-xs" style={{ color: '#a0846a' }}>
              Complete backup of all transactions, categories, goals, recurring rules, budgets, and settings. Use this to restore your full workspace.
            </p>
            <button onClick={() => exportData('json')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all w-full"
              style={{ background: '#5a6e3a', color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.background = '#3d5420'}
              onMouseLeave={e => e.currentTarget.style.background = '#5a6e3a'}>
              <span className="material-symbols-outlined text-[16px]">download</span>
              Download JSON
            </button>
          </div>

          {/* CSV export */}
          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#9e6c2a' }}>table_view</span>
              <span className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>Transactions CSV</span>
            </div>
            <p className="text-xs" style={{ color: '#a0846a' }}>
              Export all transactions as a spreadsheet-compatible CSV. Great for accountants, tax filing, or importing into Excel / Google Sheets.
            </p>
            <button onClick={() => exportData('csv')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all w-full"
              style={{ background: '#9e6c2a', color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.background = '#7c4a1e'}
              onMouseLeave={e => e.currentTarget.style.background = '#9e6c2a'}>
              <span className="material-symbols-outlined text-[16px]">download</span>
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* Import / Restore */}
      <div className="widget p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#7c4a1e' }}>upload_file</span>
          <h2 className="font-semibold text-sm" style={{ color: '#2c1f0e' }}>Restore from Backup</h2>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center gap-3"
          style={{
            borderColor: isDragOver ? '#7c4a1e' : '#d9c9b0',
            background: isDragOver ? '#f3dcc0' : '#f7f0e6',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: isDragOver ? '#7c4a1e' : '#a0846a' }}>cloud_upload</span>
          <div>
            <span className="font-semibold block text-sm" style={{ color: '#2c1f0e' }}>Drop your JSON backup here</span>
            <span className="text-xs block mt-1" style={{ color: '#a0846a' }}>or click to browse · .json files only</span>
          </div>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Validation rules */}
        <div className="rounded-xl p-3" style={{ background: '#f7f0e6', border: '1px solid #d9c9b0' }}>
          <span className="text-xs font-semibold block mb-2" style={{ color: '#6b4f35' }}>Import rules:</span>
          <ul className="text-xs space-y-1" style={{ color: '#a0846a' }}>
            <li>✓ Validates backup format and required fields before applying</li>
            <li>✓ Existing transactions are preserved — duplicates skipped by transaction ID</li>
            <li>✓ Categories and goals are fully restored from backup</li>
            <li>✓ Financial settings (floor, cushion, currency) are restored</li>
          </ul>
        </div>

        {/* Import result */}
        {result && (
          <div className="rounded-xl p-4 animate-float-up"
            style={{ background: result.success ? '#deedc8' : '#f5d5d5', border: `1px solid ${result.success ? '#c4db9e' : '#f0b8b8'}` }}>
            {result.success ? (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: '#3d5420' }}>check_circle</span>
                <span className="font-semibold text-sm" style={{ color: '#3d5420' }}>
                  Restored successfully — {result.newTxCount} new transactions merged.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: '#9b2c2c' }}>error</span>
                <span className="font-semibold text-sm" style={{ color: '#9b2c2c' }}>
                  Import failed: {result.error}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
