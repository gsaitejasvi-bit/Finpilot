import React, { useRef, useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function BackupRestore() {
  const { exportData, importData, transactions, categories, goals, showToast } = useFinancial();
  const fileRef = useRef(null);
  const [importResult, setImportResult] = useState(null);
  const [isDragOver,   setIsDragOver]   = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.json')) { showToast('Please upload a FinPilot .json backup file', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const result = importData(e.target.result);
      setImportResult(result);
      if (result.success) setTimeout(() => setImportResult(null), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="widget p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined" style={{color:'#5a6e3a'}}>backup</span>
        <h2 className="font-semibold" style={{color:'#2c1f0e',fontSize:'1rem'}}>Backup & Restore</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label:'Transactions', value:transactions.length },
          { label:'Categories',   value:categories.length  },
          { label:'Goals',        value:goals.length       },
        ].map(s=>(
          <div key={s.label} className="rounded-xl p-3 text-center" style={{background:'#f7f0e6',border:'1px solid #d9c9b0'}}>
            <span className="block font-bold text-lg" style={{color:'#7c4a1e',fontFamily:'JetBrains Mono'}}>{s.value}</span>
            <span className="text-xs" style={{color:'#a0846a'}}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Export */}
      <div>
        <label className="block font-semibold mb-2" style={{color:'#6b4f35',fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          Export Data
        </label>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>exportData('json')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{background:'#5a6e3a',color:'#fff'}}
            onMouseEnter={e=>e.currentTarget.style.background='#3d5420'}
            onMouseLeave={e=>e.currentTarget.style.background='#5a6e3a'}>
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            Full JSON Backup
          </button>
          <button onClick={()=>exportData('csv')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
            style={{background:'#9e6c2a',color:'#fff'}}
            onMouseEnter={e=>e.currentTarget.style.background='#7c4a1e'}
            onMouseLeave={e=>e.currentTarget.style.background='#9e6c2a'}>
            <span className="material-symbols-outlined text-[16px]">table_view</span>
            Transactions CSV
          </button>
        </div>
        <p className="text-xs mt-1.5" style={{color:'#a0846a'}}>
          JSON backup includes all categories, goals, recurring transactions, and settings. CSV exports transactions only.
        </p>
      </div>

      {/* Import */}
      <div>
        <label className="block font-semibold mb-2" style={{color:'#6b4f35',fontSize:'0.68rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          Restore from Backup
        </label>
        <div
          onDragOver={e=>{ e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={()=>setIsDragOver(false)}
          onDrop={e=>{ e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={()=>fileRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
          style={{borderColor:isDragOver?'#7c4a1e':'#d9c9b0',background:isDragOver?'#f3dcc0':'#f7f0e6'}}>
          <span className="material-symbols-outlined text-[32px] block mb-2" style={{color:isDragOver?'#7c4a1e':'#a0846a'}}>upload_file</span>
          <span className="font-semibold text-sm block" style={{color:'#2c1f0e'}}>Drop JSON backup here</span>
          <span className="text-xs mt-1 block" style={{color:'#a0846a'}}>or click to browse · .json files only</span>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={e=>handleFile(e.target.files[0])}/>
        </div>
        <p className="text-xs mt-1.5" style={{color:'#a0846a'}}>
          Existing transactions are preserved. Duplicates are automatically skipped based on transaction ID.
        </p>
      </div>

      {/* Import result */}
      {importResult && (
        <div className="rounded-xl p-3 animate-float-up" style={{background:importResult.success?'#deedc8':'#f5d5d5',border:`1px solid ${importResult.success?'#c4db9e':'#f0b8b8'}`}}>
          {importResult.success ? (
            <span className="text-sm font-semibold" style={{color:'#3d5420'}}>
              ✅ Restored successfully — {importResult.newTxCount} new transactions merged.
            </span>
          ) : (
            <span className="text-sm font-semibold" style={{color:'#9b2c2c'}}>
              ❌ Import failed: {importResult.error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
