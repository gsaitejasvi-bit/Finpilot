import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';

// ─── Navigation structure with collapsible sections ───────────────────────────
const NAV_SECTIONS = [
  {
    id:    'core',
    label: 'Core',
    items: [
      { id: 'overview',   label: 'Dashboard',            icon: 'grid_view'              },
      { id: 'expenses',   label: 'Expenses & Cash Flow', icon: 'account_balance_wallet' },
      { id: 'recurring',  label: 'Recurring Payments',   icon: 'autorenew'              },
      { id: 'budgets',    label: 'Budgets & Goals',      icon: 'ads_click'              },
    ],
  },
  {
    id:    'social',
    label: 'Social',
    items: [
      { id: 'split', label: 'Split Expenses', icon: 'group', badge: 'New', badgeColor: '#5a6e3a' },
    ],
  },
  {
    id:    'markets',
    label: 'Markets & Money',
    items: [
      { id: 'analytics',  label: 'Analytics & Charts',   icon: 'query_stats'            },
      { id: 'stocks',     label: 'Stocks & IPOs',        icon: 'candlestick_chart'      },
      { id: 'banking',    label: 'Banking & Accounts',   icon: 'account_balance'        },
      { id: 'currency',   label: 'Multi-Currency',       icon: 'currency_exchange'      },
    ],
  },
  {
    id:    'tools',
    label: 'Tools',
    items: [
      { id: 'notifications', label: 'Notifications',    icon: 'notifications'           },
      { id: 'backup',        label: 'Backup & Restore', icon: 'backup'                  },
      { id: 'architecture',  label: 'Agent Architecture',icon: 'memory', badge: 'Live', badgeColor: '#5a6e3a' },
    ],
  },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen } = useFinancial();

  // All sections open by default; user can collapse any
  const [collapsed, setCollapsed] = useState({});

  const handleNav = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const toggleSection = (id) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <style>{`
        @media (min-width: 1024px) {
          .fp-sidebar { transform: translateX(0) !important; }
        }
      `}</style>

      <aside
        className="fp-sidebar"
        style={{
          position: 'fixed', left: 0, top: 0, height: '100%', width: 256, zIndex: 50,
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg,#2c1f0e 0%,#3d2a14 60%,#4a3318 100%)',
          transition: 'transform 280ms cubic-bezier(0.16,1,0.3,1)',
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          willChange: 'transform',
        }}
      >
        {/* Right edge */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.1)' }} />

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 16, paddingBottom: 8 }}>

          {/* Brand */}
          <button onClick={() => handleNav('overview')} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 20px', marginBottom: 4,
            background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(243,220,192,0.15)', border: '1px solid rgba(243,220,192,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#f3dcc0' }}>finance_mode</span>
            </div>
            <div>
              <div style={{ color: '#f3dcc0', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>FinPilot</div>
              <div style={{ color: 'rgba(243,220,192,0.45)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>AI Workspace</div>
            </div>
          </button>

          {/* Divider */}
          <div style={{ margin: '0 20px 10px', height: 1, background: 'rgba(255,255,255,0.08)' }} />

          {/* Sections */}
          {NAV_SECTIONS.map(section => {
            const isCollapsed = collapsed[section.id];
            return (
              <div key={section.id} style={{ marginBottom: 4 }}>
                {/* Section header — clickable to collapse */}
                <button
                  onClick={() => toggleSection(section.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '4px 20px 4px',
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  <span style={{
                    color: 'rgba(243,220,192,0.35)', fontSize: '0.56rem',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
                  }}>
                    {section.label}
                  </span>
                  <span className="material-symbols-outlined" style={{
                    fontSize: 12, color: 'rgba(243,220,192,0.3)',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}>
                    expand_more
                  </span>
                </button>

                {/* Section items */}
                {!isCollapsed && (
                  <nav style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '2px 10px 6px' }}>
                    {section.items.map(item => {
                      const active = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNav(item.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 9,
                            padding: '7px 10px', borderRadius: 10, width: '100%', textAlign: 'left',
                            background: active ? 'rgba(243,220,192,0.14)' : 'transparent',
                            border: `1px solid ${active ? 'rgba(243,220,192,0.22)' : 'transparent'}`,
                            cursor: 'pointer', transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(243,220,192,0.06)'; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17, color: active ? '#f3dcc0' : 'rgba(243,220,192,0.42)', flexShrink: 0 }}>
                            {item.icon}
                          </span>
                          <span style={{
                            flex: 1, fontSize: '0.76rem', lineHeight: 1.3,
                            color: active ? '#f3dcc0' : 'rgba(243,220,192,0.6)',
                            fontWeight: active ? 700 : 400,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span style={{
                              fontSize: '0.55rem', padding: '2px 7px', borderRadius: 999,
                              fontWeight: 700, flexShrink: 0,
                              background: item.badgeColor ? `${item.badgeColor}33` : 'rgba(90,110,58,0.4)',
                              color: item.badgeColor ?? '#c4db9e',
                              border: `1px solid ${item.badgeColor ? `${item.badgeColor}55` : 'rgba(196,219,158,0.3)'}`,
                            }}>
                              {item.badge}
                            </span>
                          )}
                          {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f3dcc0', flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Agent status */}
          <div style={{
            margin: '0 4px 6px', padding: '8px 12px', borderRadius: 10,
            background: 'rgba(90,110,58,0.2)', border: '1px solid rgba(196,219,158,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#c4db9e', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#c4db9e', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em' }}>AGENT ACTIVE</span>
            </div>
            <span style={{ color: 'rgba(196,219,158,0.65)', fontSize: '0.58rem' }}>12ms</span>
          </div>

          {/* Settings button */}
          <button
            onClick={() => handleNav('settings')}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 10px', borderRadius: 10, width: '100%', textAlign: 'left',
              background: activeTab === 'settings' ? 'rgba(243,220,192,0.14)' : 'transparent',
              border: `1px solid ${activeTab === 'settings' ? 'rgba(243,220,192,0.22)' : 'transparent'}`,
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (activeTab !== 'settings') e.currentTarget.style.background = 'rgba(243,220,192,0.06)'; }}
            onMouseLeave={e => { if (activeTab !== 'settings') e.currentTarget.style.background = 'transparent'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17, color: activeTab === 'settings' ? '#f3dcc0' : 'rgba(243,220,192,0.42)' }}>tune</span>
            <span style={{ fontSize: '0.76rem', color: activeTab === 'settings' ? '#f3dcc0' : 'rgba(243,220,192,0.6)', fontWeight: activeTab === 'settings' ? 700 : 400 }}>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
