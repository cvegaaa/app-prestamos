import { useMemo, useState } from 'react';
import {
  Plus, Search, TrendingUp, CheckCircle2, XCircle, AlertTriangle,
  Calendar, Percent, Landmark, Wallet, ArrowLeft,
} from 'lucide-react';
import { useStore } from '@/store';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatCurrencyPrecise, formatDate, calcAmortization, computeLoanMetrics } from '@/lib/finance';
import type { Loan, LoanStatus } from '@/types';

export function Loans() {
  const { state, getClient, getLoanMetrics, getLoanInstallments, addLoan } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LoanStatus>('all');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  const filtered = useMemo(() => {
    let list = state.loans;
    if (statusFilter !== 'all') list = list.filter((l) => l.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((l) => {
        const client = getClient(l.clientId);
        return (
          l.id.toLowerCase().includes(q) ||
          (client && `${client.firstName} ${client.lastName}`.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [state.loans, statusFilter, search, getClient]);

  const selectedLoan = state.loans.find((l) => l.id === selectedLoanId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Préstamos y Simulador</h1>
          <p className="text-sm text-ink-500 mt-1">{state.loans.length} préstamos registrados</p>
        </div>
        <button
          onClick={() => setShowSimulator(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Nuevo Préstamo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID o cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ink-200 bg-white text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'finished', 'defaulted'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-800 text-white'
                  : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : s === 'finished' ? 'Finalizados' : 'En Mora'}
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
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide hidden md:table-cell">Capital</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide hidden lg:table-cell">Cuotas</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide hidden lg:table-cell">Valor Cuota</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide hidden xl:table-cell">Recuperado</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide hidden xl:table-cell">Intereses</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Pendiente</th>
                <th className="px-4 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((loan) => {
                const client = getClient(loan.clientId);
                const m = getLoanMetrics(loan.id);
                return (
                  <tr
                    key={loan.id}
                    onClick={() => setSelectedLoanId(loan.id)}
                    className="hover:bg-ink-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-ink-500">{loan.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-ink-800 group-hover:text-brand-700 transition-colors">
                        {client ? `${client.firstName} ${client.lastName}` : '—'}
                      </p>
                      <p className="text-xs text-ink-400">{formatDate(loan.startDate)}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell font-semibold text-ink-700 tabular-nums">
                      {formatCurrency(loan.principal)}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-ink-600">
                      {m.paidInstallments}/{m.totalInstallments}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-ink-600 tabular-nums">
                      {formatCurrency(loan.monthlyPayment)}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-emerald-600 tabular-nums">
                      {formatCurrency(m.recovered)}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-ink-600 tabular-nums">
                      {formatCurrency(m.interestCollected)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-rose-600 tabular-nums">
                      {formatCurrency(m.outstanding)}
                    </td>
                    <td className="px-4 py-3.5">
                      <LoanStatusBadge status={loan.status} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-ink-400">No se encontraron préstamos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLoan && (
        <LoanDetail
          loan={selectedLoan}
          onClose={() => setSelectedLoanId(null)}
          getClient={getClient}
          getLoanMetrics={getLoanMetrics}
          getLoanInstallments={getLoanInstallments}
        />
      )}

      {showSimulator && (
        <SimulatorModal
          onClose={() => setShowSimulator(false)}
          clients={state.clients}
          onConfirm={addLoan}
        />
      )}
    </div>
  );
}

function LoanStatusBadge({ status }: { status: LoanStatus }) {
  if (status === 'active') return <Badge tone="info"><CheckCircle2 size={12} /> Activo</Badge>;
  if (status === 'finished') return <Badge tone="success"><CheckCircle2 size={12} /> Finalizado</Badge>;
  return <Badge tone="danger"><AlertTriangle size={12} /> En Mora</Badge>;
}

function LoanDetail({
  loan,
  onClose,
  getClient,
  getLoanMetrics,
  getLoanInstallments,
}: {
  loan: Loan;
  onClose: () => void;
  getClient: ReturnType<typeof useStore>['getClient'];
  getLoanMetrics: ReturnType<typeof useStore>['getLoanMetrics'];
  getLoanInstallments: ReturnType<typeof useStore>['getLoanInstallments'];
}) {
  const client = getClient(loan.clientId);
  const m = getLoanMetrics(loan.id);
  const installments = getLoanInstallments(loan.id);

  return (
    <Modal open onClose={onClose} title={`Préstamo ${loan.id}`} subtitle={client ? `${client.firstName} ${client.lastName}` : ''} size="xl">
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard icon={<Landmark size={16} />} label="Capital Prestado" value={formatCurrency(loan.principal)} tone="accent" />
          <SummaryCard icon={<Calendar size={16} />} label="Cuotas" value={`${loan.termMonths} × ${formatCurrency(loan.monthlyPayment)}`} />
          <SummaryCard icon={<Percent size={16} />} label="TNA" value={`${(loan.annualRate * 100).toFixed(0)}%`} />
          <SummaryCard icon={<Wallet size={16} />} label="Total a Cobrar" value={formatCurrency(loan.totalToPay)} tone="positive" />
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-semibold text-ink-700">Progreso de recuperación</span>
            <span className="text-ink-500">{m.paidInstallments} de {m.totalInstallments} cuotas pagas</span>
          </div>
          <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${m.totalInstallments ? (m.paidInstallments / m.totalInstallments) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Financial breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Capital Recuperado" value={formatCurrency(m.recovered)} color="text-emerald-600" />
          <StatBox label="Intereses Cobrados" value={formatCurrency(m.interestCollected)} color="text-brand-700" />
          <StatBox label="Capital Pendiente" value={formatCurrency(m.outstanding)} color="text-rose-600" />
          <StatBox label="Cuotas Atrasadas" value={String(m.lateInstallments)} color="text-amber-600" />
        </div>

        {/* Amortization table */}
        <div>
          <h3 className="text-sm font-bold text-ink-800 mb-3">Tabla de Amortización</h3>
          <div className="border border-ink-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin max-h-72">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-ink-50">
                  <tr className="text-left border-b border-ink-200">
                    <th className="px-3 py-2 font-semibold text-ink-600">#</th>
                    <th className="px-3 py-2 font-semibold text-ink-600">Vencimiento</th>
                    <th className="px-3 py-2 font-semibold text-ink-600 text-right">Capital</th>
                    <th className="px-3 py-2 font-semibold text-ink-600 text-right">Interés</th>
                    <th className="px-3 py-2 font-semibold text-ink-600 text-right">Cuota</th>
                    <th className="px-3 py-2 font-semibold text-ink-600 text-right">Saldo</th>
                    <th className="px-3 py-2 font-semibold text-ink-600">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {installments.map((inst, i) => {
                    const balance = loan.principal - installments.slice(0, i + 1).reduce((s, x) => s + x.capitalAmount, 0);
                    return (
                      <tr key={inst.id} className="hover:bg-ink-50/70">
                        <td className="px-3 py-2 font-semibold text-ink-700">{inst.number}</td>
                        <td className="px-3 py-2 text-ink-600">{formatDate(inst.dueDate)}</td>
                        <td className="px-3 py-2 text-right text-ink-600 tabular-nums">{formatCurrencyPrecise(inst.capitalAmount)}</td>
                        <td className="px-3 py-2 text-right text-brand-600 tabular-nums">{formatCurrencyPrecise(inst.interestAmount)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-ink-700 tabular-nums">{formatCurrencyPrecise(inst.totalAmount)}</td>
                        <td className="px-3 py-2 text-right text-ink-500 tabular-nums">{formatCurrency(Math.max(0, balance))}</td>
                        <td className="px-3 py-2">
                          {inst.status === 'paid' && <Badge tone="success">Pagada</Badge>}
                          {inst.status === 'pending' && <Badge tone="neutral">Pendiente</Badge>}
                          {inst.status === 'late' && <Badge tone="danger">Atrasada</Badge>}
                          {inst.status === 'cancelled' && <Badge tone="neutral">Cancelada</Badge>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: 'accent' | 'positive' }) {
  const bg = tone === 'accent' ? 'bg-brand-50' : tone === 'positive' ? 'bg-emerald-50' : 'bg-ink-50';
  const text = tone === 'accent' ? 'text-brand-700' : tone === 'positive' ? 'text-emerald-600' : 'text-ink-600';
  return (
    <div className={`${bg} rounded-lg p-3`}>
      <div className={`flex items-center gap-1.5 ${text} mb-1`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-bold text-ink-800 tabular-nums">{value}</p>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border border-ink-200 rounded-lg p-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className={`text-lg font-bold ${color} tabular-nums mt-1`}>{value}</p>
    </div>
  );
}

function SimulatorModal({
  onClose,
  clients,
  onConfirm,
}: {
  onClose: () => void;
  clients: ReturnType<typeof useStore>['state']['clients'];
  onConfirm: ReturnType<typeof useStore>['addLoan'];
}) {
  const [clientId, setClientId] = useState('');
  const [principal, setPrincipal] = useState('500000');
  const [termMonths, setTermMonths] = useState('12');
  const [annualRatePct, setAnnualRatePct] = useState('60');
  const [confirmed, setConfirmed] = useState(false);

  const p = parseFloat(principal) || 0;
  const t = parseInt(termMonths) || 0;
  const r = (parseFloat(annualRatePct) || 0) / 100;
  const result = useMemo(() => (p > 0 && t > 0 ? calcAmortization(p, r, t) : null), [p, r, t]);

  const handleConfirm = () => {
    if (!clientId || !result) return;
    onConfirm(clientId, p, t, r);
    setConfirmed(true);
    setTimeout(onClose, 1200);
  };

  return (
    <Modal open onClose={onClose} title="Simulador de Préstamo" subtitle="Cálculo automático de amortización (sistema francés)" size="xl">
      {confirmed ? (
        <div className="py-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-lg font-bold text-ink-900">Préstamo registrado</h3>
          <p className="text-sm text-ink-500 mt-1">El préstamo fue desembolsado y las cuotas fueron generadas.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-ink-500 mb-1.5">Cliente</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 bg-white"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} — DNI {c.dni}
                  </option>
                ))}
              </select>
            </div>
            <SimField label="Capital a prestar ($)" value={principal} onChange={setPrincipal} />
            <SimField label="Cantidad de cuotas" value={termMonths} onChange={setTermMonths} />
            <SimField label="Tasa nominal anual (%)" value={annualRatePct} onChange={setAnnualRatePct} />
            <div className="flex items-end">
              <div className="w-full bg-brand-50 rounded-lg p-3">
                <p className="text-xs text-brand-700 font-medium">Cuota mensual fija</p>
                <p className="text-xl font-bold text-brand-800 tabular-nums">
                  {result ? formatCurrency(result.monthlyPayment) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Results */}
          {result && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <ResultBox label="Total a cobrar" value={formatCurrency(result.totalToPay)} tone="default" />
                <ResultBox label="Interés total" value={formatCurrency(result.totalInterest)} tone="accent" />
                <ResultBox label="Ganancia sobre capital" value={`${((result.totalInterest / p) * 100).toFixed(0)}%`} tone="positive" />
              </div>

              {/* Amortization preview */}
              <div>
                <h3 className="text-sm font-bold text-ink-800 mb-2">Amortización por cuota</h3>
                <div className="border border-ink-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto scrollbar-thin max-h-60">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-ink-50">
                        <tr className="text-left border-b border-ink-200">
                          <th className="px-3 py-2 font-semibold text-ink-600">#</th>
                          <th className="px-3 py-2 font-semibold text-ink-600 text-right">Capital</th>
                          <th className="px-3 py-2 font-semibold text-ink-600 text-right">Interés</th>
                          <th className="px-3 py-2 font-semibold text-ink-600 text-right">Cuota</th>
                          <th className="px-3 py-2 font-semibold text-ink-600 text-right">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {result.schedule.map((row, i) => (
                          <tr key={i} className="hover:bg-ink-50/70">
                            <td className="px-3 py-2 font-semibold text-ink-700">{i + 1}</td>
                            <td className="px-3 py-2 text-right text-ink-600 tabular-nums">{formatCurrencyPrecise(row.capital)}</td>
                            <td className="px-3 py-2 text-right text-brand-600 tabular-nums">{formatCurrencyPrecise(row.interest)}</td>
                            <td className="px-3 py-2 text-right font-semibold text-ink-700 tabular-nums">{formatCurrencyPrecise(row.total)}</td>
                            <td className="px-3 py-2 text-right text-ink-500 tabular-nums">{formatCurrencyPrecise(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-600 hover:bg-ink-100 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!clientId || !result}
              className="px-4 py-2.5 rounded-lg bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Registrar Préstamo
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function SimField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-500 mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
      />
    </div>
  );
}

function ResultBox({ label, value, tone }: { label: string; value: string; tone: 'default' | 'accent' | 'positive' }) {
  const styles = {
    default: 'bg-ink-50 text-ink-800',
    accent: 'bg-brand-50 text-brand-800',
    positive: 'bg-emerald-50 text-emerald-700',
  }[tone];
  return (
    <div className={`${styles} rounded-lg p-3`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-lg font-bold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}
