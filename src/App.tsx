import { useState } from 'react';
import { Menu } from 'lucide-react';
import { StoreProvider } from '@/store';
import { Sidebar, type ViewId } from '@/components/Sidebar';
import { Dashboard } from '@/views/Dashboard';
import { Clients } from '@/views/Clients';
import { Loans } from '@/views/Loans';
import { Installments } from '@/views/Installments';
import { Expenses } from '@/views/Expenses';
import { Admin } from '@/views/Admin';

function AppShell() {
  const [view, setView] = useState<ViewId>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-ink-100">
      <Sidebar
        active={view}
        onSelect={setView}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-ink-900 text-white border-b border-ink-800">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-ink-800 transition-colors"
          >
            <Menu size={22} />
          </button>
          <span className="font-bold text-sm">LoanManager Pro</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto animate-fade-in">
          {view === 'dashboard' && <Dashboard onNavigate={setView} />}
          {view === 'clients' && <Clients />}
          {view === 'loans' && <Loans />}
          {view === 'installments' && <Installments />}
          {view === 'expenses' && <Expenses />}
          {view === 'admin' && <Admin />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
