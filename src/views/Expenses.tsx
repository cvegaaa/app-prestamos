import { useMemo, useState } from 'react';
import { Plus, Trash2, Receipt, Building2, Scale, Stamp, FolderCog, Truck, TrendingDown } from 'lucide-react';
import { useStore } from '@/store';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/finance';
import type { ExpenseCategory } from '@/types';

const categoryConfig: Record<ExpenseCategory, { label: string; icon: typeof Receipt; tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand' }> = {
  monotributo: { label: 'Monotributo', icon: Building2, tone: 'info' },
  accountant: { label: 'Honorarios', icon: Scale, tone: 'brand' },
  stamps: { label: 'Sellados', icon: Stamp, tone: 'warning' },
  administrative: { label: 'Administrativos', icon: FolderCog, tone: 'neutral' },
  operational: { label: 'Operativos', icon: Truck, tone: 'success' },
};

export function Expenses() {
  const { state, addExpense, deleteExpense } = useStore();
  const [showAdd, setShowAdd] = useState(false);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthExpenses = useMemo(
    () => state.expenses.filter((e) => new Date(e.date) >= monthStart),
    [state.expenses, monthStart]
  );

  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const e of thisMonthExpenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return map;
  }, [thisMonthExpenses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Gastos del Negocio</h1>
          <p className="text-sm text-ink-500 mt-1">Gastos operativos que impactan la rentabilidad mensual</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Registrar Gasto
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-gradient-to-br from-rose-50 to-white rounded-xl border border-rose-200 p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-lg bg-rose-100 text-rose-600">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Total del Mes</p>
              <p className="text-2xl font-bold text-rose-700 tabular-nums">{formatCurrency(totalThisMonth)}</p>
            </div>
          </div>
          <p className="text-xs text-ink-400 mt-2">{thisMonthExpenses.length} gastos registrados este mes</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-ink-200 shadow-card p-5">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-4">Resumen por categoría</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(categoryConfig) as ExpenseCategory[]).map((cat) => {
              const cfg = categoryConfig[cat];
              const Icon = cfg.icon;
              const amount = byCategory.get(cat) ?? 0;
              const pct = totalThisMonth > 0 ? (amount / totalThisMonth) * 100 : 0;
              return (
                <div key={cat} className="border border-ink-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={15} className="text-ink-500" />
                    <span className="text-xs font-medium text-ink-600">{cfg.label}</span>
                  </div>
                  <p className="text-sm font-bold text-ink-800 tabular-nums">{formatCurrency(amount)}</p>
                  <div className="mt-1.5 h-1 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-ink-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-200">
          <h2 className="text-sm font-bold text-ink-800">Gastos del mes actual</h2>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-200 text-left">
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Fecha</th>
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Categoría</th>
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Descripción</th>
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide text-right">Monto</th>
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {thisMonthExpenses.map((expense) => {
                const cfg = categoryConfig[expense.category];
                const Icon = cfg.icon;
                return (
                  <tr key={expense.id} className="hover:bg-ink-50/70 transition-colors group">
                    <td className="px-5 py-3.5 text-ink-600">{formatDate(expense.date)}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={cfg.tone}>
                        <Icon size={12} /> {cfg.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">{expense.description}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-rose-600 tabular-nums">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="p-1.5 rounded-lg text-ink-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {thisMonthExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-ink-400">No hay gastos registrados este mes</td>
                </tr>
              )}
            </tbody>
            {thisMonthExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-ink-50 border-t border-ink-200">
                  <td colSpan={3} className="px-5 py-3.5 font-bold text-ink-700">Total</td>
                  <td className="px-5 py-3.5 text-right font-bold text-rose-700 tabular-nums text-base">{formatCurrency(totalThisMonth)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onAdd={addExpense} />}
    </div>
  );
}

function AddExpenseModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: ReturnType<typeof useStore>['addExpense'];
}) {
  const [category, setCategory] = useState<ExpenseCategory>('monotributo');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!description || !amount) {
      setError('Descripción y monto son obligatorios');
      return;
    }
    onAdd({
      category,
      description,
      amount: parseFloat(amount) || 0,
      date: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Registrar Gasto" subtitle="Impacta la rentabilidad del mes actual" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1.5">Categoría</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(categoryConfig) as ExpenseCategory[]).map((cat) => {
              const cfg = categoryConfig[cat];
              const Icon = cfg.icon;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    category === cat
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  <Icon size={16} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1.5">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Monotributo categoría C - mensual"
            className="w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1.5">Monto ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="38000"
            className="w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-600 hover:bg-ink-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 rounded-lg bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            Registrar Gasto
          </button>
        </div>
      </div>
    </Modal>
  );
}
