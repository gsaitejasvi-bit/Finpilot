import React, { useState, useEffect } from 'react';
import { useFinancial } from '../../context/FinancialContext';

export default function CommandPalette() {
  const { 
    isCommandPaletteOpen, 
    setIsCommandPaletteOpen, 
    setActiveTab, 
    executeReasoningQuery,
    runArchitectureSimulation,
    showToast 
  } = useFinancial();
  
  const [searchTerm, setSearchTerm] = useState('');

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const commands = [
    {
      group: "Navigation",
      items: [
        { label: "Go to Overview / Workstation", icon: "grid_view", action: () => setActiveTab('overview') },
        { label: "Open Agent Architecture (Hackathon)", icon: "memory", action: () => setActiveTab('architecture') },
        { label: "Inspect Expenses & Cash Flow", icon: "account_balance_wallet", action: () => setActiveTab('expenses') },
        { label: "View Category Budgets & Goals", icon: "ads_click", action: () => setActiveTab('budgets') },
        { label: "Open Analytics & Asset Research", icon: "query_stats", action: () => setActiveTab('analytics') },
        { label: "Settings & System Telemetry", icon: "tune", action: () => setActiveTab('settings') }
      ]
    },
    {
      group: "Autonomous Evaluations",
      items: [
        { 
          label: "Evaluate: Can I afford ₹4,000 Goa flight?", 
          icon: "flight_takeoff", 
          action: () => {
            setActiveTab('overview');
            executeReasoningQuery("Can I afford a ₹4,000 Goa flight this weekend?");
          } 
        },
        { 
          label: "Stress Test: ₹85,000 MacBook Pro purchase", 
          icon: "laptop_mac", 
          action: () => {
            setActiveTab('architecture');
            runArchitectureSimulation('laptop');
          } 
        },
        { 
          label: "Simulate: Increase Index Fund SIP by ₹2,500", 
          icon: "trending_up", 
          action: () => {
            setActiveTab('architecture');
            runArchitectureSimulation('sip');
          } 
        }
      ]
    },
    {
      group: "System & Actions",
      items: [
        { 
          label: "Export Ledger Dossier (CSV/JSON)", 
          icon: "file_download", 
          action: () => showToast("Exported ledger snapshot to encrypted archive") 
        },
        { 
          label: "Force Open Banking Ledger Resync", 
          icon: "sync", 
          action: () => showToast("Replica sync quorum established across 3 institutions (14ms)") 
        }
      ]
    }
  ];

  const filteredGroups = commands.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-2xl border border-surface-container-highest overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-surface-container-highest gap-3">
          <span className="material-symbols-outlined text-outline text-[22px]">search</span>
          <input
            autoFocus
            type="text"
            placeholder="Type a command or financial inquiry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60"
          />
          <span className="font-label-sm text-label-sm text-outline px-1.5 py-0.5 rounded bg-surface-container border border-surface-container-highest">
            ESC
          </span>
        </div>

        {/* Command list */}
        <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-3">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant font-body-sm">
              No matching commands or actions found.
            </div>
          ) : (
            filteredGroups.map(group => (
              <div key={group.group} className="flex flex-col gap-1">
                <span className="px-3 py-1 font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                  {group.group}
                </span>
                {group.items.map(item => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      setIsCommandPaletteOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-on-surface hover:bg-surface-container transition-colors group"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]">
                      {item.icon}
                    </span>
                    <span className="font-body-md text-body-md flex-1">
                      {item.label}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
