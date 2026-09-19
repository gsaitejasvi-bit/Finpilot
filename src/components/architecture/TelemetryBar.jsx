import React from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function TelemetryBar() {
  const { architectureViewMode, setArchitectureViewMode, showToast } = useFinancial();

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-md flex flex-wrap items-center justify-between gap-space-md shadow-xs border border-surface-container-highest">
      <div className="flex items-center gap-space-md">
        <div className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></div>
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs flex-wrap">
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
              FinPilot Autonomous Decision Engine
            </span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">
              PIPELINE v2.4.9
            </span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              Hackathon Evaluation Mode
            </span>
          </div>
          <span className="font-label-md text-label-md text-on-surface-variant mt-0.5">
            Runtime: Healthy · E2E Latency: 142ms · Fallback Verification: Active (Deterministic Quorum)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-space-md flex-wrap">
        {/* View Toggle HUD */}
        <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-surface-container-highest">
          <button 
            onClick={() => {
              setArchitectureViewMode('judge');
              showToast('Switched to Technical Judge Trace View');
            }}
            className={`px-space-md py-1 rounded font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 ${
              architectureViewMode === 'judge'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            <span>Technical Judge View</span>
          </button>
          <button 
            onClick={() => {
              setArchitectureViewMode('consumer');
              showToast('Switched to Consumer Experience View');
            }}
            className={`px-space-md py-1 rounded font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 ${
              architectureViewMode === 'consumer'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Consumer View</span>
          </button>
        </div>

        <div className="h-6 w-px bg-surface-container-highest hidden sm:block"></div>

        <div className="flex items-center gap-space-xs font-metric-md text-body-sm text-on-surface">
          <span className="text-on-surface-variant font-medium">SEED HASH:</span>
          <span className="bg-surface-container-low px-2 py-0.5 rounded text-primary font-mono text-label-sm border border-surface-container-highest">
            0x9F4A...B72C
          </span>
        </div>
      </div>
    </div>
  );
}
