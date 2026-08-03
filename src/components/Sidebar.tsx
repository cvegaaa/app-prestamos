import { LayoutDashboard, Users, Landmark, CalendarClock, Receipt, TerminalSquare, Wallet } from 'lucide-react';

export type ViewId = 'dashboard' | 'clients' | 'loans' | 'installments' | 'expenses' | 'admin';

interface NavItem {
  id: ViewId;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Panel de control' },
  { id: 'clients', label: 'Clientes', icon: Users, description: 'Base de clientes' },
  { id: 'loans', label: 'Préstamos', icon: Landmark, description: 'Préstamos y simulador' },
  { id: 'installments', label: 'Cuotas', icon: CalendarClock, description: 'Gestión y cobro' },
  { id: 'expenses', label: 'Gastos', icon: Receipt, description: 'Gastos del negocio' },
  { id: 'admin', label: 'Sistema', icon: TerminalSquare, description: 'Log y arquitectura' },
];

export function Sidebar({
  active,
  onSelect,
  mobileOpen,
  onCloseMobile,
}: {
  active: ViewId;
  onSelect: (id: ViewId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 bg-ink-900 text-ink-200 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-ink-800 shrink-0">
          <div className="p-2 rounded-lg bg-brand-800 text-white">
            <Wallet size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-tight">LoanManager</p>
            <p className="text-[11px] text-brand-300 font-semibold tracking-widest uppercase">PRO</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.id);
                  onCloseMobile();
                }}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-800 text-white shadow-sm'
                    : 'text-ink-400 hover:text-white hover:bg-ink-800'
                }`}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-brand-200' : ''
                  }`}
                />
                <div className="text-left min-w-0">
                  <p className="truncate">{item.label}</p>
                  <p
                    className={`text-[10px] truncate ${
                      isActive ? 'text-brand-200/80' : 'text-ink-500 group-hover:text-ink-300'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-ink-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-white text-sm font-bold">
              MR
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">Martín Rigo</p>
              <p className="text-[11px] text-ink-500 truncate">Administrador</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
