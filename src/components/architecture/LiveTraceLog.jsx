import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import ConsumerOutcome from './ConsumerOutcome';

export default function LiveTraceLog() {
  const { 
    architectureViewMode, 
    activeScenario, 
    runArchitectureSimulation 
  } = useFinancial();

  const [promptInput, setPromptInput] = useState("Can I afford a ₹4,000 flight to Goa this weekend?");

  const handleSimulate = () => {
    runArchitectureSimulation(activeScenario);
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col gap-space-md border border-surface-container-highest">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Live Pipeline Execution Trace
          </h3>
        </div>
        <div className="flex items-center gap-space-xs">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
          <span className="font-label-sm text-label-sm text-tertiary font-mono font-medium">
            MONITORING TRACE #FP-8842-GOA
          </span>
        </div>
      </div>

      {/* Prompt Simulator Bar */}
      <div className="flex flex-col gap-1.5">
        <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
          SAMPLE TEST TRANSACTION / QUERY
        </label>
        <div className="flex items-center gap-space-sm flex-wrap sm:flex-nowrap">
          <div className="flex-1 bg-surface-container-low rounded-lg px-space-md py-2 flex items-center gap-space-sm focus-within:ring-1 focus-within:ring-primary border border-surface-container-highest">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">psychology</span>
            <input 
              className="w-full bg-transparent outline-none font-body-md text-body-md text-on-surface font-medium" 
              type="text" 
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSimulate}
            className="bg-primary hover:bg-primary-container text-on-primary px-space-md py-2 rounded-lg font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Simulate Query</span>
          </button>
        </div>
      </div>

      {/* Dual HUD Mode View */}
      {architectureViewMode === 'consumer' ? (
        <ConsumerOutcome />
      ) : (
        /* Technical Judge Trace Stream */
        <div className="flex flex-col gap-space-sm bg-surface-container-low p-space-md rounded-lg font-metric-md text-body-sm text-on-surface border border-surface-container-highest">
          <div className="flex items-center justify-between text-label-sm text-on-surface-variant pb-2 border-b border-surface-container-highest">
            <span className="font-mono font-semibold">TIMESTAMP [UTC+05:30]</span>
            <span className="font-mono font-semibold">INSPECTION FRAME</span>
            <span className="font-mono font-semibold">STATUS</span>
          </div>

          {/* Trace Item 1: Ingestion */}
          <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-sm rounded border border-surface-container-highest">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-mono text-label-sm">14:02:18.012</span>
              <span className="text-primary font-semibold font-mono text-label-sm">INTENT_PARSER</span>
              <span className="text-tertiary text-label-sm font-semibold">CONFIDENCE 0.994</span>
            </div>
            <p className="font-mono text-label-sm text-on-surface leading-relaxed">
              Extracted: <span className="text-primary">{'{'} intent: "DISCRETIONARY_PURCHASE_EVAL", amount: 4000, currency: "INR", category: "TRAVEL", elasticity: "MODERATE" {'}'}</span>
            </p>
          </div>

          {/* Trace Item 2: Context Retrieval */}
          <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-sm rounded border border-surface-container-highest">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-mono text-label-sm">14:02:18.036</span>
              <span className="text-secondary font-semibold font-mono text-label-sm">CONTEXT_ENGINE</span>
              <span className="text-on-surface-variant text-label-sm font-mono">3 TOOLS EXECUTED</span>
            </div>
            <div className="bg-surface-container-low p-2 rounded text-label-sm font-mono flex flex-col gap-1 border border-surface-container-highest">
              <div><span className="text-on-surface-variant">tool:</span> <span className="text-on-surface font-semibold">lookup_account_balance()</span> -&gt; <span className="text-tertiary font-semibold">Liquid Cash: ₹42,850.00</span></div>
              <div><span className="text-on-surface-variant">tool:</span> <span className="text-on-surface font-semibold">get_emergency_buffer()</span> -&gt; <span className="text-secondary font-semibold">Floor: ₹25,000.00 (Hard constraint)</span></div>
              <div><span className="text-on-surface-variant">tool:</span> <span className="text-on-surface font-semibold">simulate_goal_delay()</span> -&gt; <span className="text-on-surface">Goal "Emergency SIP": +0 days (Uncompromised)</span></div>
            </div>
          </div>

          {/* Trace Item 3: Deterministic Arithmetic Calculation */}
          <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-sm rounded border-l-4 border-primary border border-surface-container-highest">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-mono text-label-sm">14:02:18.067</span>
              <span className="text-primary font-bold font-mono text-label-sm">DETERMINISTIC_MATH_SERVICE</span>
              <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-mono font-semibold">SAFE</span>
            </div>
            <div className="text-label-sm font-mono text-on-surface leading-relaxed">
              <div>Discretionary Buffer = ₹42,850 - ₹25,000 (Reserve) - ₹11,200 (Upcoming Bills) = <span className="text-tertiary font-bold">₹6,650</span></div>
              <div>Delta after ₹4,000 outflow = <span className="text-on-surface font-semibold">₹2,650</span> (&gt; Safe Discretionary Margin of ₹1,500)</div>
              <div className="text-on-surface-variant text-[11px] mt-0.5">Calculated in isolated Rust WASM sandbox; zero floating-point approximation drift.</div>
            </div>
          </div>

          {/* Trace Item 4: Policy & Safety Validation */}
          <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-sm rounded border border-surface-container-highest">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-mono text-label-sm">14:02:18.086</span>
              <span className="text-tertiary font-semibold font-mono text-label-sm">POLICY_EVALUATOR</span>
              <span className="text-tertiary text-label-sm font-semibold">APPROVED (CODE: 200_AFFORDABLE)</span>
            </div>
            <p className="font-mono text-label-sm text-on-surface-variant">
              Constraint Check: Emergency Buffer [PASS] · Monthly Burn [PASS] · High-Priority SIP Impact [0%]
            </p>
          </div>

          {/* Trace Item 5: Structured Synthesis */}
          <div className="flex flex-col gap-1 bg-surface-container-lowest p-space-sm rounded border border-surface-container-highest">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-mono text-label-sm">14:02:18.134</span>
              <span className="text-on-surface font-semibold font-mono text-label-sm">NARRATIVE_SYNTHESIZER</span>
              <span className="text-primary text-label-sm font-mono">HASH: 4d28f8...c1</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface italic">
              "Yes, you can comfortably afford the ₹4,000 flight. Even after this expense and reserving ₹11,200 for next week's bills, your ₹25,000 emergency fund remains completely intact with ₹2,650 buffer remaining."
            </p>
          </div>

          {/* Bottom Micro-Bar: Cryptographic Audit Trail */}
          <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest text-label-sm text-on-surface-variant flex-wrap gap-1">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-tertiary">lock</span>
              <span>Deterministic Audit Proof: SHA-256 HMAC Verified</span>
            </div>
            <span className="font-mono">Payload ID: fp_tx_99812_afford</span>
          </div>
        </div>
      )}
    </div>
  );
}
