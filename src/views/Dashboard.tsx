import { useMemo } from 'react';
import {
  TrendingUp, Wallet, Clock, CheckCircle2, DollarSign, TrendingDown,
  PiggyBank, CalendarClock, AlertTriangle, ArrowUpRight,
} from 'lucide-react';
import { useStore } from '@/store';
import { KpiCard } from '@/components/KpiCard';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatDate, computeLoanMetrics } from '@/lib/finance';
import { getMonthlySeries } from '@/lib/dummyData';
import type { ViewId } from '@/components/Sidebar';

export function Dashboard({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { state, getClient } = useStore();
  const series = getMonthlySeries();

  const metrics = useMemo(() => {
    let activeLent = 0;
    let totalRecovered = 0;
    let totalOutstanding = 0;
    let totalInterestCollected = 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let recoveredThisMonth = 0;
    let interestThisMonth = 0;

    for (const loan of state.loans) {
      const m = computeLoanMetrics(loan, state.installments);
      if (loan.status === 'active') {
        activeLent += loan.principal;
        totalOutstanding += m.outstanding;
      }
      totalRecovered += m.recovered;
      totalInterestCollected += m.interestCollected;

      // this month
      const loanInstallments = state.installments.filter((i) => i.loanId === loan.id);
      for (const inst of loanInstallments) {
        if (inst.status === 'paid' && inst.paidAt) {
          const paidDate = new Date(inst.paidAt);
          if (paidDate >= monthStart) {
            recoveredThisMonth += inst.capitalAmount;
            interestThisMonth += inst.interestAmount;
          }
        }
      }
    }

    const expensesThisMonth = state.expenses
      .filter((e) => new Date(e.date) >= monthStart)
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfitThisMonth = interestThisMonth - expensesThisMonth;
    const ownerWithdrawal = (netProfitThisMonth * state.config.ownerWithdrawalPct) / 100;

    return {
      activeLent,
      totalRecovered,
      totalOutstanding,
      totalInterestCollected,
      recoveredThisMonth,
      interestThisMonth,
      expensesThisMonth,
      netProfitThisMonth,
      ownerWithdrawal,
    };
  }, [state]);

  // Upcoming & late installments
  const { upcoming, late } = useMemo(() => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming: typeof state.installments = [];
    const late: typeof state.installments = [];
    for (const inst of state.installments) {
      if (inst.status === 'pending') {
        const due = new Date(inst.dueDate);
        if (due < now) late.push(inst);
        else if (due <= in7Days) upcoming.push(inst);
      } else if (inst.status === 'late') {
        late.push(inst);
      }
    }
    upcoming.sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
    late.sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
    return { upcoming: upcoming.slice(0, 6), late: late.slice(0, 6) };
  }, [state.installments]);

  const maxBar = Math.max(...series.flatMap((s) => [s.lent, s.recovered, s.net]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Panel de Control</h1>
        <p className="text-sm text-ink-500 mt-1">
          Resumen financiero del negocio — {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Capital Prestado"
          value={formatCurrency(metrics.activeLent)}
          sublabel="Préstamos activos actualmente"
          icon={<Wallet size={20} />}
          tone="accent"
        />
        <KpiCard
          label="Capital por Recuperar"
          value={formatCurrency(metrics.totalOutstanding)}
          sublabel="Saldo pendiente de cobro"
          icon={<Clock size={20} />}
          tone="negative"
        />
        <KpiCard
          label="Capital Recuperado (Total)"
          value={formatCurrency(metrics.totalRecovered)}
          sublabel={`Del mes: ${formatCurrency(metrics.recoveredThisMonth)}`}
          icon={<CheckCircle2 size={20} />}
          tone="positive"
        />
        <KpiCard
          label="Intereses Cobrados"
          value={formatCurrency(metrics.interestThisMonth)}
          sublabel="Ganancia bruta del mes"
          icon={<DollarSign size={20} />}
          tone="positive"
        />
        <KpiCard
          label="Gastos del Mes"
          value={formatCurrency(metrics.expensesThisMonth)}
          sublabel="Gastos operativos"
          icon={<TrendingDown size={20} />}
          tone="negative"
        />
        <KpiCard
          label="Ganancia Neta Mensual"
          value={formatCurrency(metrics.netProfitThisMonth)}
          sublabel="Intereses − Gastos"
          icon={<TrendingUp size={20} />}
          tone="positive"
        />
        <KpiCard
          label="Retiro Sugerido del Dueño"
          value={formatCurrency(metrics.ownerWithdrawal)}
          sublabel={`${state.config.ownerWithdrawalPct}% de ganancia neta · sin descapitalizar`}
          icon={<PiggyBank size={20} />}
          tone="owner"
        />
        <KpiCard
          label="Intereses (Acumulado)"
          value={formatCurrency(metrics.totalInterestCollected)}
          sublabel="Ganancia histórica de intereses"
          icon={<ArrowUpRight size={20} />}
          tone="default"
        />
      </div>

      {/* Chart + Upcoming */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-ink-200 shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-ink-900">Evolución — Últimos 6 meses</h2>
              <p className="text-xs text-ink-500 mt-0.5">Capital prestado vs. Recuperación vs. Ganancia neta</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-brand-800" /> Prestado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Recuperado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-400" /> Neta
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 sm:gap-6 h-56">
            {series.map((s) => (
              <div key={s.month} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center gap-1 h-44">
                  <div
                    className="w-2.5 sm:w-3 rounded-t bg-brand-800 transition-all duration-300 group-hover:bg-brand-700"
                    style={{ height: `${(s.lent / maxBar) * 100}%` }}
                    title={`Prestado: ${formatCurrency(s.lent)}`}
                  />
                  <div
                    className="w-2.5 sm:w-3 rounded-t bg-emerald-500 transition-all duration-300 group-hover:bg-emerald-400"
                    style={{ height: `${(s.recovered / maxBar) * 100}%` }}
                    title={`Recuperado: ${formatCurrency(s.recovered)}`}
                  />
                  <div
                    className="w-2.5 sm:w-3 rounded-t bg-amber-400 transition-all duration-300 group-hover:bg-amber-300"
                    style={{ height: `${(s.net / maxBar) * 100}%` }}
                    title={`Neta: ${formatCurrency(s.net)}`}
                  />
                </div>
                <span className="text-xs font-medium text-ink-500">{s.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming installments */}
        <div className="bg-white rounded-xl border border-ink-200 shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-ink-900">Vencimientos próximos</h2>
            <button
              onClick={() => onNavigate('installments')}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-2.5">
            {upcoming.length === 0 && (
              <p className="text-sm text-ink-400 py-4 text-center">No hay vencimientos próximos</p>
            )}
            {upcoming.map((inst) => {
              const client = getClient(state.loans.find((l) => l.id === inst.loanId)?.clientId ?? '');
              return (
                <div
                  key={inst.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-ink-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-brand-50 text-brand-700 shrink-0">
                      <CalendarClock size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">
                        {client ? `${client.firstName} ${client.lastName}` : '—'}
                      </p>
                      <p className="text-xs text-ink-400">Cuota #{inst.number} · {formatDate(inst.dueDate)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink-700 tabular-nums shrink-0">
                    {formatCurrency(inst.totalAmount)}
                  </span>
                </div>
              );
            })}
          </div>

          {late.length > 0 && (
            <div className="mt-4 pt-4 border-t border-ink-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-rose-500" />
                <h3 className="text-sm font-bold text-rose-600">Cuotas atrasadas</h3>
                <Badge tone="danger">{late.length}</Badge>
              </div>
              <div className="space-y-2">
                {late.slice(0, 4).map((inst) => {
                  const client = getClient(state.loans.find((l) => l.id === inst.loanId)?.clientId ?? '');
                  return (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-lg bg-rose-50/60"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-800 truncate">
                          {client ? `${client.firstName} ${client.lastName}` : '—'}
                        </p>
                        <p className="text-xs text-rose-500">Venció {formatDate(inst.dueDate)}</p>
                      </div>
                      <span className="text-sm font-semibold text-rose-600 tabular-nums shrink-0">
                        {formatCurrency(inst.totalAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
