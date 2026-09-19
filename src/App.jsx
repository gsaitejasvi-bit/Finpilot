import React from 'react';
import { FinancialProvider, useFinancial } from './context/FinancialContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SplitProvider } from './context/SplitContext';

// Auth
import AuthScreen from './components/auth/AuthScreen';
import OnboardingWizard from './components/auth/OnboardingWizard';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Toast from './components/layout/Toast';
import CommandPalette from './components/common/CommandPalette';
import GlobalModals from './components/common/GlobalModals';

// Feature views — every nav item has its own dedicated page
import OverviewDashboardView  from './components/dashboard/OverviewDashboardView';
import AgentArchitectureView  from './components/architecture/AgentArchitectureView';
import ExpensesView           from './components/cashflow/ExpensesView';
import BudgetsGoalsView       from './components/goals/BudgetsGoalsView';
import AnalyticsView          from './components/analytics/AnalyticsView';
import SettingsView           from './components/settings/SettingsView';

// New feature pages (each has its own nav entry)
import RecurringView          from './components/recurring/RecurringView';
import BankingView            from './components/banking/BankingView';
import StocksView             from './components/stocks/StocksView';
import CurrencyView           from './components/currency/CurrencyView';
import NotificationsView      from './components/notifications/NotificationsView';
import BackupView             from './components/backup/BackupView';
import SplitExpensesView      from './components/split/SplitExpensesView';

// Bottom navigation items (mobile)
const BOTTOM_NAV = [
  { id: 'overview',      icon: 'grid_view',              label: 'Home'      },
  { id: 'expenses',      icon: 'account_balance_wallet', label: 'Expenses'  },
  { id: 'budgets',       icon: 'ads_click',              label: 'Budgets'   },
  { id: 'split',         icon: 'group',                  label: 'Split'     },
  { id: 'analytics',     icon: 'query_stats',            label: 'Analytics' },
];

function ActiveView() {
  const { activeTab } = useFinancial();
  switch (activeTab) {
    case 'overview':      return <OverviewDashboardView />;
    case 'expenses':      return <ExpensesView />;
    case 'recurring':     return <RecurringView />;
    case 'budgets':       return <BudgetsGoalsView />;
    case 'analytics':     return <AnalyticsView />;
    case 'banking':       return <BankingView />;
    case 'stocks':        return <StocksView />;
    case 'currency':      return <CurrencyView />;
    case 'notifications': return <NotificationsView />;
    case 'backup':        return <BackupView />;
    case 'split':         return <SplitExpensesView />;
    case 'architecture':  return <AgentArchitectureView />;
    case 'settings':      return <SettingsView />;
    default:              return <OverviewDashboardView />;
  }
}

function MobileBottomNav() {
  const { activeTab, setActiveTab } = useFinancial();
  // Only show 5 most-used items on tiny screens; user scrolls for the rest
  const visible = BOTTOM_NAV.slice(0, 5);
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t"
      style={{
        background: 'rgba(253,248,242,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: '#d9c9b0',
        height: 56,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {visible.map(item => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all"
            style={{ color: active ? '#7c4a1e' : '#a0846a' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 21, color: active ? '#7c4a1e' : '#a0846a' }}>
              {item.icon}
            </span>
            <span style={{ fontSize: '0.55rem', fontWeight: active ? 700 : 400 }}>{item.label}</span>
            {active && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#7c4a1e' }} />}
          </button>
        );
      })}
    </nav>
  );
}

function AppContent() {
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useFinancial();

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex">
      {/* Mobile overlay — tap to close sidebar */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(44,31,14,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — always visible on desktop, slide-in on mobile */}
      <Sidebar />

      {/* Main content — offset right of sidebar on desktop */}
      <div className="flex-1 flex flex-col min-w-0" style={{ paddingLeft: 0 }}>
        {/* Spacer so content clears the sidebar on desktop */}
        <div className="hidden lg:block" style={{ width: 256, position: 'fixed', pointerEvents: 'none' }} />

        <Header />

        <main
          className="relative w-full min-h-screen bg-surface"
          style={{
            paddingTop: 56,       // clears fixed header
            paddingBottom: 72,    // clears mobile bottom nav
            marginLeft: 0,
          }}
        >
          {/* On desktop, shift content right of the 256px sidebar */}
          <div className="lg:pl-64">
            <ActiveView />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />

      {/* Global overlays */}
      <Toast />
      <CommandPalette />
      <GlobalModals />
    </div>
  );
}

function AuthGate() {
  const { currentUser } = useAuth();
  if (!currentUser)                        return <AuthScreen />;
  if (!currentUser.hasCompletedOnboarding) return <OnboardingWizard />;
  return (
    <FinancialProvider>
      <SplitProvider>
        <AppContent />
      </SplitProvider>
    </FinancialProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
