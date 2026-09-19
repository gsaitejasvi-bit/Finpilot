import React from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function StressTestScenarios() {
  const { runArchitectureSimulation } = useFinancial();

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col gap-space-md border border-surface-container-highest">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Hackathon Stress Tests
          </h3>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
          Presets
        </span>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Click any scenario below to trigger instant agent evaluation:
      </p>

      <div className="flex flex-col gap-space-xs">
        {/* Scenario 1: Flight */}
        <button 
          onClick={() => runArchitectureSimulation('flight')}
          className="w-full text-left p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-between group border border-surface-container-highest"
        >
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[20px] text-tertiary">flight_takeoff</span>
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                Affordable Trip: ₹4,000 Goa Flight
              </span>
              <span className="font-label-sm text-label-sm text-tertiary font-medium">
                Result: APPROVED (Leaves ₹2,650 buffer)
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>

        {/* Scenario 2: Laptop */}
        <button 
          onClick={() => runArchitectureSimulation('laptop')}
          className="w-full text-left p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-between group border border-surface-container-highest"
        >
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[20px] text-error">laptop_mac</span>
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                Unsafe Purchase: ₹85,000 MacBook Pro
              </span>
              <span className="font-label-sm text-label-sm text-error font-medium">
                Result: REJECTED (Breaches Emergency Core)
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>

        {/* Scenario 3: SIP */}
        <button 
          onClick={() => runArchitectureSimulation('sip')}
          className="w-full text-left p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-between group border border-surface-container-highest"
        >
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[20px] text-secondary">trending_up</span>
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                Goal Reallocation: Increase SIP by ₹2,500
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-medium">
                Result: OPTIMIZED (Retirement goal -11 mos)
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>

      {/* Active Model Metadata & Latency Economics */}
      <div className="p-space-sm rounded-lg bg-surface-container-low border border-surface-container-highest flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between text-label-sm">
          <span className="text-on-surface-variant font-medium">Token Economics (Per Evaluation):</span>
          <span className="font-mono text-on-surface font-semibold">284 in / 89 out (~₹0.04)</span>
        </div>
        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
          <div className="bg-primary h-full rounded-full" style={{ width: '28%' }}></div>
        </div>
        <div className="flex items-center justify-between text-label-sm text-on-surface-variant flex-wrap gap-1">
          <span>P99 Latency: <strong className="text-on-surface font-mono">168ms</strong></span>
          <span>Cold Starts: <strong className="text-on-surface font-mono">0</strong></span>
          <span>WASM Mem: <strong className="text-on-surface font-mono">1.8MB</strong></span>
        </div>
      </div>
    </div>
  );
}
