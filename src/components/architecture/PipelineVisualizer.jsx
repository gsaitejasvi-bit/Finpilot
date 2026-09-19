import React from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function PipelineVisualizer() {
  const { 
    pipelineNodes, 
    selectedNodeIndex, 
    setSelectedNodeIndex,
    isSimulatingNodes 
  } = useFinancial();

  const activeNode = pipelineNodes[selectedNodeIndex] || pipelineNodes[3];

  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col gap-space-md border border-surface-container-highest">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Deterministic Execution Chain
          </span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Zero-Hallucination Agent Pipeline
          </h2>
        </div>
        <div className="flex items-center gap-space-sm font-label-md text-label-md text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5 text-tertiary font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            Strict Typing Enforced
          </span>
          <span>·</span>
          <span className="font-medium">7/7 Modules Validated</span>
        </div>
      </div>

      {/* 7 Pipeline Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-space-xs relative">
        {pipelineNodes.map((node, index) => {
          const isSelected = selectedNodeIndex === index;
          const isCore = node.stage.includes('CORE');

          return (
            <div
              key={node.stage}
              onClick={() => setSelectedNodeIndex(index)}
              className={`cursor-pointer p-space-sm rounded-lg transition-all flex flex-col justify-between group border ${
                isSelected
                  ? 'ring-2 ring-primary border-primary bg-primary-fixed/20'
                  : isCore
                  ? 'bg-primary-fixed/10 border-primary/40 hover:bg-primary-fixed/20'
                  : 'bg-surface-container-low border-surface-container-highest hover:bg-surface-container'
              } ${isSimulatingNodes ? 'scale-[1.02] bg-primary-fixed/30 transition-transform' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-label-sm text-label-sm font-semibold ${
                    isCore ? 'text-primary' : 'text-on-surface-variant'
                  }`}>
                    {node.stage}
                  </span>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono font-medium">
                    {node.latency}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 my-1">
                  <span className={`material-symbols-outlined text-[18px] ${node.iconColor}`}>
                    {node.icon}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold leading-tight">
                    {node.name}
                  </span>
                </div>

                <p className="font-label-sm text-label-sm text-on-surface-variant line-clamp-1">
                  {node.desc}
                </p>
              </div>

              <div className="mt-2 pt-1 border-t border-surface-container-highest flex items-center justify-between text-label-sm">
                <span className={`font-semibold ${
                  isCore ? 'text-primary' : 'text-tertiary'
                }`}>
                  {node.status}
                </span>
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Node Details Inspection Panel */}
      <div className="bg-surface-container-low rounded-lg p-space-md flex flex-wrap items-center justify-between gap-space-md border-l-4 border-primary border border-surface-container-highest shadow-xs">
        <div className="flex items-center gap-space-md">
          <div className="w-9 h-9 rounded bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">
              {activeNode.icon}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
              {activeNode.stage} INSPECTION
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              {activeNode.name} Microservice
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 max-w-3xl">
              {activeNode.fullDesc}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm font-metric-md text-body-sm flex-wrap">
          <span className="px-space-sm py-1 bg-surface-container rounded text-on-surface font-mono font-medium border border-surface-container-highest">
            EXECUTION: {activeNode.latency}
          </span>
          <span className="px-space-sm py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded font-semibold">
            ERROR_RATE: 0.000%
          </span>
        </div>
      </div>
    </div>
  );
}
