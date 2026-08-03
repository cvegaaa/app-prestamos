import { useMemo, useState } from 'react';
import { Search, UserPlus, Phone, MapPin, CreditCard, Star, ArrowLeft, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useStore } from '@/store';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatDate, computeLoanMetrics } from '@/lib/finance';
import type { Client } from '@/types';

export function Clients() {
  const { state, addClient, getClientLoans, getLoanMetrics } = useStore();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return state.clients;
    return state.clients.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.dni.includes(q) ||
        c.phone.includes(q)
    );
  }, [state.clients, search]);

  const selected = state.clients.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Gestión de Clientes</h1>
          <p className="text-sm text-ink-500 mt-1">{state.clients.length} clientes registrados</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, DNI o teléfono..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ink-200 bg-white text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-shadow"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-ink-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50 border-b border-ink-200 text-left">
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Cliente</th>
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">DNI</th>
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide hidden md:table-cell">Teléfono</th>
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide hidden lg:table-cell">Domicilio</th>
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Score</th>
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide">Estado</th>
                <th className="px-5 py-3 font-semibold text-ink-600 text-xs uppercase tracking-wide text-right">Préstamos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((client) => {
                const loans = getClientLoans(client.id);
                const activeCount = loans.filter((l) => l.status === 'active').length;
                return (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedId(client.id)}
                    className="hover:bg-ink-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-800 group-hover:text-brand-700 transition-colors">
                            {client.firstName} {client.lastName}
                          </p>
                          <p className="text-xs text-ink-400">{client.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-600 tabular-nums">{client.dni}</td>
                    <td className="px-5 py-3.5 text-ink-600 hidden md:table-cell tabular-nums">{client.phone}</td>
                    <td className="px-5 py-3.5 text-ink-600 hidden lg:table-cell max-w-[200px] truncate">{client.address}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-ink-700 tabular-nums">{client.creditScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {client.status === 'active' ? (
                        <Badge tone="success">Activo</Badge>
                      ) : (
                        <Badge tone="danger">Suspendido</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-semibold text-ink-700">{loans.length}</span>
                      <span className="text-xs text-ink-400 ml-1">({activeCount} act.)</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-ink-400">
                    No se encontraron clientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client detail */}
      {selected && (
        <ClientDetail
          client={selected}
          onClose={() => setSelectedId(null)}
          getClientLoans={getClientLoans}
          getLoanMetrics={getLoanMetrics}
        />
      )}

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdd={addClient} />}
    </div>
  );
}

function ClientDetail({
  client,
  onClose,
  getClientLoans,
  getLoanMetrics,
}: {
  client: Client;
  onClose: () => void;
  getClientLoans: ReturnType<typeof useStore>['getClientLoans'];
  getLoanMetrics: ReturnType<typeof useStore>['getLoanMetrics'];
}) {
  const loans = getClientLoans(client.id);

  return (
    <Modal open onClose={onClose} title={`${client.firstName} ${client.lastName}`} subtitle={`Cliente desde ${formatDate(client.createdAt)}`} size="xl">
      <div className="space-y-6">
        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoTile icon={<CreditCard size={16} />} label="DNI" value={client.dni} />
          <InfoTile icon={<Phone size={16} />} label="Teléfono" value={client.phone} />
          <InfoTile icon={<MapPin size={16} />} label="Ciudad" value={client.city} />
          <InfoTile icon={<Star size={16} />} label="Score Crediticio" value={String(client.creditScore)} />
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <MapPin size={16} className="text-ink-400" />
          <span>{client.address}</span>
        </div>

        {/* Credit history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-ink-800 flex items-center gap-2">
              <FileText size={16} className="text-brand-700" />
              Historial Crediticio
            </h3>
            <Badge tone={client.status === 'active' ? 'success' : 'danger'}>
              {client.status === 'active' ? 'Cliente Activo' : 'Suspendido'}
            </Badge>
          </div>

          {loans.length === 0 ? (
            <p className="text-sm text-ink-400 py-4 text-center bg-ink-50 rounded-lg">Sin préstamos registrados</p>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => {
                const m = getLoanMetrics(loan.id);
                return (
                  <div key={loan.id} className="border border-ink-200 rounded-lg p-4 hover:border-brand-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-ink-400">{loan.id}</span>
                        <LoanStatusBadge status={loan.status} />
                      </div>
                      <span className="text-sm font-bold text-ink-800">{formatCurrency(loan.principal)}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <Metric label="Cuotas" value={`${m.paidInstallments}/${m.totalInstallments}`} />
                      <Metric label="Recuperado" value={formatCurrency(m.recovered)} />
                      <Metric label="Intereses" value={formatCurrency(m.interestCollected)} />
                      <Metric label="Pendiente" value={formatCurrency(m.outstanding)} />
                    </div>
                    <div className="mt-3 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${m.totalInstallments ? (m.paidInstallments / m.totalInstallments) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-ink-50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-ink-400 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold text-ink-800">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-ink-400">{label}</p>
      <p className="font-semibold text-ink-700 tabular-nums">{value}</p>
    </div>
  );
}

function LoanStatusBadge({ status }: { status: string }) {
  if (status === 'active') return <Badge tone="info"><CheckCircle2 size={12} /> Activo</Badge>;
  if (status === 'finished') return <Badge tone="success"><CheckCircle2 size={12} /> Finalizado</Badge>;
  return <Badge tone="danger"><XCircle size={12} /> En Mora</Badge>;
}

function AddClientModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: ReturnType<typeof useStore>['addClient'];
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    address: '',
    city: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.dni) {
      setError('Nombre, apellido y DNI son obligatorios');
      return;
    }
    onAdd(form);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Nuevo Cliente" subtitle="Registrar cliente en la base de datos" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} placeholder="Juan" />
          <Field label="Apellido" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} placeholder="Pérez" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="DNI" value={form.dni} onChange={(v) => setForm({ ...form, dni: v })} placeholder="28.456.123" />
          <Field label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="341 1234567" />
        </div>
        <Field label="Domicilio" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="San Martín 1234" />
        <Field label="Ciudad" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Rosario" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-600 hover:bg-ink-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 rounded-lg bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            Registrar Cliente
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-500 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg border border-ink-200 text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-shadow"
      />
    </div>
  );
}
