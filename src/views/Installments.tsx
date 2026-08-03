import { useMemo, useState } from 'react';
import { Search, CheckCircle2, Clock, AlertTriangle, Ban, CheckCircle, Wallet } from 'lucide-react';
import { useStore } from '@/store';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatCurrencyPrecise, formatDate } from '@/lib/finance';
import type { InstallmentStatus, Installment } from '@/types';

const statusConfig: Record<InstallmentStatus, { label: string; tone: 'success' | 'neutral' | 'danger' | 'warning'; icon: typeof CheckCircle2 }> = {
  paid: { label: 'Pagada', tone: 'success', icon: CheckCircle2 },
  pending: { label: 'Pendiente', tone: 'neutral', icon: Clock },
  late: { label: 'Atrasada', tone: 'danger', icon: AlertTriangle },
  cancelled: { label: 'Cancelada', tone: 'warning', icon: Ban },
};

export function Installments() {
  const { state, getClient, getLoan, payInstallment } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InstallmentStatus>('all');
  const [payTarget, setPayTarget] = useState<Installment | null>(null);

  const filtered = useMemo(() => {
    let list = state.installments;
    if (statusFilter !== 'all') list = list.filter((i) => i.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((i) => {
        const loan = getLoan(i.loanId);
        const client = loan ? getClient(loan.clientId) : null;
        return (
          i.loanId.toLowerCase().includes(q) ||
          (client && `${client.firstName} ${client.lastName}`.toLowerCase().includes(q))
        );
      });
    }
    return list.sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
  }, [state.installments, statusFilter, search, getClient, getLoan]);

  const counts = useMemo(() => {
    const c = { pending: 0, paid: 0, late: 0, cancelled: 0 };
    for (const i of state.installments) c[i.status]++;
    return c;
  }, [state.installments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Gestión y Cobro de Cuotas</h1>
        <p className="text-sm text-ink-500 mt-1">{state.installments.length} cuotas registradas en el sistema</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard label="Pendientes" count={counts.pending} tone="neutral" icon={<Clock size={18} />} />
        <StatusCard label="Pagadas" count={counts.paid} tone="success" icon={<CheckCircle2 size={18} />} />
        <StatusCard label="Atrasadas" count={counts.late} tone="danger" icon={<AlertTriangle size={18} />} />
        <StatusCard label="Canceladas" count={counts.cancelled} tone="warning" icon={<Ban size={18} />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por préstamo o cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ink-200 bg-white text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'paid', 'late', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-800 text-white'
                  : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
              }`}
            >
              {s === 'all' ? 'Todas' : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-ink-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-200 text-left">
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Préstamo</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide hidden md:table-cell">Cuota</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide hidden lg:table-cell">Vencimiento</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide text-right">Importe</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.slice(0, 100).map((inst) => {
                const loan = getLoan(inst.loanId);
                const client = loan ? getClient(loan.clientId) : null;
                const cfg = statusConfig[inst.status];
                const Icon = cfg.icon;
                return (
                  <tr key={inst.id} className="hover:bg-ink-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">{inst.loanId}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink-800">{client ? `${client.firstName} ${client.lastName}` : '—'}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-ink-600">#{inst.number}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-ink-600">{formatDate(inst.dueDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink-700 tabular-nums">
                      {formatCurrency(inst.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={cfg.tone}>
                        <Icon size={12} /> {cfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(inst.status === 'pending' || inst.status === 'late') ? (
                        <button
                          onClick={() => setPayTarget(inst)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-sm"
                        >
                          <Wallet size={14} />
                          Cobrar
                        </button>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-400">No se encontraron cuotas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="px-4 py-3 bg-ink-50 text-xs text-ink-500 text-center border-t border-ink-200">
            Mostrando 100 de {filtered.length} cuotas — usa los filtros para acotar
          </div>
        )}
      </div>

      {payTarget && (
        <PaymentModal
          installment={payTarget}
          onClose={() => setPayTarget(null)}
          onConfirm={() => {
            payInstallment(payTarget.id);
            setPayTarget(null);
          }}
          getClient={getClient}
          getLoan={getLoan}
        />
      )}
    </div>
  );
}

function StatusCard({ label, count, tone, icon }: { label: string; count: number; tone: 'success' | 'neutral' | 'danger' | 'warning'; icon: React.ReactNode }) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    neutral: 'bg-ink-50 text-ink-600 border-ink-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  }[tone];
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${styles}`}>
      <div className="p-2 rounded-lg bg-white/60">{icon}</div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{count}</p>
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
    </div>
  );
}

function PaymentModal({
  installment,
  onClose,
  onConfirm,
  getClient,
  getLoan,
}: {
  installment: Installment;
  onClose: () => void;
  onConfirm: () => void;
  getClient: ReturnType<typeof useStore>['getClient'];
  getLoan: ReturnType<typeof useStore>['getLoan'];
}) {
  const loan = getLoan(installment.loanId);
  const client = loan ? getClient(loan.clientId) : null;
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirm();
    }, 1100);
  };

  if (confirmed) {
    return (
      <Modal open onClose={onClose} title="Cobro registrado" size="sm">
        <div className="py-10 text-center">
          <div className="inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-scale-in">
            <CheckCircle size={40} />
          </div>
          <h3 className="text-lg font-bold text-ink-900">Cuota cobrada con éxito</h3>
          <p className="text-sm text-ink-500 mt-1">La amortización fue separada y los KPIs actualizados.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Registrar Cobro de Cuota" subtitle={client ? `${client.firstName} ${client.lastName}` : ''} size="md">
      <div className="space-y-5">
        {/* Installment info */}
        <div className="bg-ink-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Préstamo</span>
            <span className="font-mono text-ink-700">{installment.loanId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Cuota</span>
            <span className="font-semibold text-ink-700">#{installment.number} de {loan?.termMonths}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Vencimiento</span>
            <span className="font-semibold text-ink-700">{formatDate(installment.dueDate)}</span>
          </div>
        </div>

        {/* Amortization breakdown */}
        <div>
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Separación de amortización</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-ink-50 border border-ink-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-ink-200 text-ink-700">
                  <Wallet size={16} />
                </div>
                <span className="text-sm font-medium text-ink-700">Importe Abonado</span>
              </div>
              <span className="text-lg font-bold text-ink-900 tabular-nums">{formatCurrencyPrecise(installment.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-sm font-medium text-emerald-800">Capital Recuperado</span>
              </div>
              <span className="text-lg font-bold text-emerald-700 tabular-nums">{formatCurrencyPrecise(installment.capitalAmount)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-brand-50 border border-brand-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-100 text-brand-700">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-sm font-medium text-brand-800">Interés Cobrado (ganancia real)</span>
              </div>
              <span className="text-lg font-bold text-brand-700 tabular-nums">{formatCurrencyPrecise(installment.interestAmount)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-600 hover:bg-ink-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <CheckCircle2 size={18} />
            Confirmar Cobro
          </button>
        </div>
      </div>
    </Modal>
  );
}
