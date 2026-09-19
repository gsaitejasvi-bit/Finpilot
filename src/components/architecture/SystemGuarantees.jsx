import React from 'react';

export default function SystemGuarantees() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col gap-space-sm border border-surface-container-highest">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary text-[20px]">balance</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            System Guarantees
          </h3>
        </div>
        <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-semibold">
          ZERO RISK
        </span>
      </div>
      
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        FinPilot strictly segregates statistical language reasoning from arithmetic calculation.
      </p>

      <div className="flex flex-col gap-space-xs mt-2">
        {/* Feature 1 */}
        <div className="p-space-sm rounded bg-surface-container-low flex items-start gap-space-sm border border-surface-container-highest">
          <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">verified_user</span>
          <div className="flex flex-col">
            <span className="font-body-md text-body-md font-semibold text-on-surface">
              No Stochastic Balance Arithmetic
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Calculations occur solely within a deterministic WASM execution sandbox. The LLM receives pre-computed scalar values.
            </span>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="p-space-sm rounded bg-surface-container-low flex items-start gap-space-sm border border-surface-container-highest">
          <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">lock_clock</span>
          <div className="flex flex-col">
            <span className="font-body-md text-body-md font-semibold text-on-surface">
              Emergency Buffer Clamping
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Hard boundary logic prevents non-essential approvals if remaining balance falls within 10% of user emergency threshold.
            </span>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="p-space-sm rounded bg-surface-container-low flex items-start gap-space-sm border border-surface-container-highest">
          <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">sync_alt</span>
          <div className="flex flex-col">
            <span className="font-body-md text-body-md font-semibold text-on-surface">
              Open Banking Freshness Quorum
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Account aggregator state synced with a 15-minute TTL. Unverified records trigger an automatic forced-refresh.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
