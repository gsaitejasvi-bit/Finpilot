import React from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function ConsumerOutcome() {
  const { activeScenario } = useFinancial();

  if (activeScenario === 'laptop') {
    return (
      <div className="flex flex-col gap-space-md bg-surface-container-low p-space-md rounded-lg border border-surface-container-highest animate-fade-in">
        <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-lg shadow-xs border border-surface-container-highest">
          <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">cancel</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-error font-semibold uppercase">
              Affordability Decision
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Purchase Not Recommended
            </span>
            <span className="font-body-md text-body-md text-on-surface-variant">
              This purchase would breach your ₹25,000 emergency liquid floor by ₹36,250.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
          <div className="bg-surface-container-lowest p-space-sm rounded text-center border border-surface-container-highest">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">MacBook Pro Cost</span>
            <span className="font-metric-md text-metric-md text-error font-semibold">₹85,000</span>
          </div>
          <div className="bg-surface-container-lowest p-space-sm rounded text-center border border-surface-container-highest">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">Emergency Reserve</span>
            <span className="font-metric-md text-metric-md text-error font-semibold">-₹36,250 Deficit</span>
          </div>
          <div className="bg-surface-container-lowest p-space-sm rounded text-center border border-surface-container-highest">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">Guardrail Status</span>
            <span className="font-metric-md text-metric-md text-error font-semibold">Clamped</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest text-label-sm text-on-surface-variant">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-error">lock</span>
            <span>Policy Floor Enforcement: Active</span>
          </div>
          <span className="font-mono">Payload ID: fp_tx_clamp_8842</span>
        </div>
      </div>
    );
  }

  if (activeScenario === 'sip') {
    return (
      <div className="flex flex-col gap-space-md bg-surface-container-low p-space-md rounded-lg border border-surface-container-highest animate-fade-in">
        <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-lg shadow-xs border border-surface-container-highest">
          <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">verified</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">
              SIP Optimization Decision
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Optimal & Accelerated
            </span>
            <span className="font-body-md text-body-md text-on-surface-variant">
              Increasing SIP by ₹2,500 accelerates your primary retirement milestone by 11 months.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
          <div className="bg-surface-container-lowest p-space-sm rounded text-center border border-surface-container-highest">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">Incremental SIP</span>
            <span className="font-metric-md text-metric-md text-on-surface font-semibold">₹2,500 / mo</span>
          </div>
          <div className="bg-surface-container-lowest p-space-sm rounded text-center border border-surface-container-highest">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">Surplus Preserved</span>
            <span className="font-metric-md text-metric-md text-tertiary font-semibold">₹42,250 / mo</span>
          </div>
          <div className="bg-surface-container-lowest p-space-sm rounded text-center border border-surface-container-highest">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">10-Yr Yield Corpus</span>
            <span className="font-metric-md text-metric-md text-secondary font-semibold">+₹5.14 Lakhs</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest text-label-sm text-on-surface-variant">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-tertiary">lock</span>
            <span>Deterministic Compounding Engine Verified</span>
          </div>
          <span className="font-mono">Payload ID: fp_sip_opt_9921</span>
        </div>
      </div>
    );
  }

  // Default: Flight scenario
  return (
    <div className="flex flex-col gap-space-md bg-surface-container-low p-space-md rounded-lg border border-surface-container-highest animate-fade-in">
      <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-md rounded-lg shadow-xs border border-surface-container-highest">
        <div className="w-12 h-12 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[28px]">check_circle</span>
        </div>
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-tertiary font-semibold uppercase">
            Affordability Decision
          </span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Yes, proceed safely
          </span>
          <span className="font-body-md text-body-md text-on-surface-variant">
            This flight leaves your ₹25,000 emergency reserve 100% untouched.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
        <div className="bg-surface-container-lowest p-space-sm rounded text-center border border-surface-container-highest">
          <span className="font-label-sm text-label-sm text-on-surface-variant block">Flight Cost</span>
          <span className="font-metric-md text-metric-md text-on-surface font-semibold">₹4,000</span>
        </div>
        <div className="bg-surface-container-lowest p-space-sm rounded text-center border border-surface-container-highest">
          <span className="font-label-sm text-label-sm text-on-surface-variant block">Buffer Remaining</span>
          <span className="font-metric-md text-metric-md text-tertiary font-semibold">₹2,650</span>
        </div>
        <div className="bg-surface-container-lowest p-space-sm rounded text-center border border-surface-container-highest">
          <span className="font-label-sm text-label-sm text-on-surface-variant block">Emergency Core</span>
          <span className="font-metric-md text-metric-md text-on-surface font-semibold">100% Safe</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest text-label-sm text-on-surface-variant">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-tertiary">lock</span>
          <span>Deterministic Audit Proof: SHA-256 HMAC Verified</span>
        </div>
        <span className="font-mono">Payload ID: fp_tx_99812_afford</span>
      </div>
    </div>
  );
}
