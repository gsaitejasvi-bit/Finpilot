import React from 'react';
import TelemetryBar from './TelemetryBar';
import PipelineVisualizer from './PipelineVisualizer';
import LiveTraceLog from './LiveTraceLog';
import SystemGuarantees from './SystemGuarantees';
import StressTestScenarios from './StressTestScenarios';

export default function AgentArchitectureView() {
  return (
    <div className="flex flex-col w-full min-w-0">
      <div className="flex flex-col gap-space-lg p-space-xl max-w-[1600px] mx-auto w-full">
        {/* Top System Telemetry Bar (Editorial Technical Strip) */}
        <TelemetryBar />

        {/* Multi-Stage Pipeline Visualization (Horizontal Interactive Node Chain) */}
        <PipelineVisualizer />

        {/* Main Live Execution Inspector Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Left Column: Active Trace Log (Terminal & Tool Invocations) */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <LiveTraceLog />
          </div>

          {/* Right Column: System Guarantees & Safety Architecture */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <SystemGuarantees />
            <StressTestScenarios />
          </div>
        </div>
      </div>
    </div>
  );
}
