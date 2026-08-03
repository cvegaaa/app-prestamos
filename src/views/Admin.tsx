import { useMemo, useState } from 'react';
import {
  Terminal, Database, Users, Landmark, CalendarClock, Wallet,
  Info, Cog, AlertTriangle, XCircle, ArrowRight, Settings, Server,
} from 'lucide-react';
import { useStore } from '@/store';
import { Badge } from '@/components/Badge';
import { formatCurrency, formatDateTime } from '@/lib/finance';
import type { SystemLog } from '@/types';

const levelConfig: Record<SystemLog['level'], { tone: 'info' | 'neutral' | 'warning' | 'danger'; color: string }> = {
  INFO: { tone: 'info', color: 'text-brand-600' },
  AUTO: { tone: 'neutral', color: 'text-ink-600' },
  WARN: { tone: 'warning', color: 'text-amber-600' },
  ERROR: { tone: 'danger', color: 'text-rose-600' },
};

export function Admin() {
  const { state, updateConfig } = useStore();
  const [levelFilter, setLevelFilter] = useState<'all' | SystemLog['level']>('all');
  const [withdrawalPct, setWithdrawalPct] = useState(String(state.config.ownerWithdrawalPct));

  const filteredLogs = useMemo(() => {
    if (levelFilter === 'all') return state.logs;
    return state.logs.filter((l) => l.level === levelFilter);
  }, [state.logs, levelFilter]);

  const dbStats = useMemo(() => {
    return {
      clients: state.clients.length,
      loans: state.loans.length,
      installments: state.installments.length,
      expenses: state.expenses.length,
      logs: state.logs.length,
    };
  }, [state]);

  const handleSaveConfig = () => {
    const pct = Math.min(100, Math.max(0, parseFloat(withdrawalPct) || 0));
    updateConfig({ ownerWithdrawalPct: pct });
    setWithdrawalPct(String(pct));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <Terminal size={24} className="text-brand-700" />
          Consola de Administración
        </h1>
        <p className="text-sm text-ink-500 mt-1">Arquitectura del sistema, auditoría y configuración financiera</p>
      </div>

      {/* Architecture flow */}
      <div className="bg-white rounded-xl border border-ink-200 shadow-card p-6">
        <h2 className="text-sm font-bold text-ink-800 mb-1">Flujo Relacional del Sistema</h2>
        <p className="text-xs text-ink-500 mb-5">Esquema visual: Clientes → Préstamos → Amortización → Caja Neto</p>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-2">
          <FlowNode icon={<Users size={20} />} label="Clientes" sublabel={`${dbStats.clients} registros`} tone="brand" />
          <FlowArrow />
          <FlowNode icon={<Landmark size={20} />} label="Préstamos" sublabel={`${dbStats.loans} contratos`} tone="accent" />
          <FlowArrow />
          <FlowNode icon={<CalendarClock size={20} />} label="Amortización" sublabel={`${dbStats.installments} cuotas`} tone="info" />
          <FlowArrow />
          <FlowNode icon={<Wallet size={20} />} label="Caja Neto" sublabel="Capital + Interés − Gastos" tone="positive" />
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-ink-600">
          <div className="flex items-start gap-2 p-3 bg-ink-50 rounded-lg">
            <ArrowRight size={14} className="text-ink-400 mt-0.5 shrink-0" />
            <span><strong className="text-ink-800">1:N</strong> — Un cliente puede tener múltiples préstamos activos o finalizados simultáneamente.</span>
          </div>
          <div className="flex items-start gap-2 p-3 bg-ink-50 rounded-lg">
            <ArrowRight size={14} className="text-ink-400 mt-0.5 shrink-0" />
            <span><strong className="text-ink-800">1:N</strong> — Cada préstamo genera un plan de cuotas con amortización sistema francés (capital + interés).</span>
          </div>
          <div className="flex items-start gap-2 p-3 bg-ink-50 rounded-lg">
            <ArrowRight size={14} className="text-ink-400 mt-0.5 shrink-0" />
            <span><strong className="text-ink-800">Cobro → Caja</strong> — Al cobrar una cuota, el sistema separa capital recuperado e interés cobrado (ganancia real).</span>
          </div>
          <div className="flex items-start gap-2 p-3 bg-ink-50 rounded-lg">
            <ArrowRight size={14} className="text-ink-400 mt-0.5 shrink-0" />
            <span><strong className="text-ink-800">Gastos → Caja</strong> — Los gastos operativos del mes se descuentan de la ganancia bruta para obtener la neta.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* System logs */}
        <div className="xl:col-span-2 bg-ink-900 rounded-xl border border-ink-800 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white">System Logs — Auditoría</h2>
            </div>
            <div className="flex gap-1.5">
              {(['all', 'INFO', 'AUTO', 'WARN', 'ERROR'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    levelFilter === lvl
                      ? 'bg-emerald-500 text-white'
                      : 'bg-ink-800 text-ink-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto scrollbar-thin max-h-[460px] p-4 font-mono text-xs space-y-1">
            {filteredLogs.map((log) => {
              const cfg = levelConfig[log.level];
              return (
                <div key={log.id} className="flex items-start gap-2 py-1 px-2 rounded hover:bg-ink-800/60 transition-colors">
                  <span className="text-ink-500 shrink-0">[{formatDateTime(log.timestamp)}]</span>
                  <span className={`shrink-0 font-bold ${cfg.color}`}>{log.level}</span>
                  <span className="text-ink-400 shrink-0">[{log.module}]</span>
                  <span className="text-ink-200 break-all">{log.message}</span>
                </div>
              );
            })}
            {filteredLogs.length === 0 && (
              <div className="text-center text-ink-500 py-8">No hay logs para este filtro</div>
            )}
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-6">
          {/* DB status */}
          <div className="bg-white rounded-xl border border-ink-200 shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database size={18} className="text-brand-700" />
              <h2 className="text-sm font-bold text-ink-800">Estado de Base de Datos</h2>
            </div>
            <div className="space-y-2.5">
              <DbRow icon={<Users size={14} />} label="Tabla: clients" count={dbStats.clients} />
              <DbRow icon={<Landmark size={14} />} label="Tabla: loans" count={dbStats.loans} />
              <DbRow icon={<CalendarClock size={14} />} label="Tabla: installments" count={dbStats.installments} />
              <DbRow icon={<Wallet size={14} />} label="Tabla: expenses" count={dbStats.expenses} />
              <DbRow icon={<Terminal size={14} />} label="Tabla: system_logs" count={dbStats.logs} />
            </div>
            <div className="mt-4 pt-4 border-t border-ink-200 flex items-center gap-2">
              <Server size={14} className="text-emerald-500" />
              <span className="text-xs font-medium text-ink-600">PostgreSQL 15 · Supabase</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 font-semibold">Online</span>
              </span>
            </div>
          </div>

          {/* Config */}
          <div className="bg-white rounded-xl border border-ink-200 shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={18} className="text-brand-700" />
              <h2 className="text-sm font-bold text-ink-800">Configuración Financiera</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1.5">
                  % máximo retiro del dueño (sin descapitalizar)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={withdrawalPct}
                      onChange={(e) => setWithdrawalPct(e.target.value)}
                      className="w-full px-3 py-2 pr-8 rounded-lg border border-ink-200 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">%</span>
                  </div>
                  <button
                    onClick={handleSaveConfig}
                    className="px-3 py-2 rounded-lg bg-brand-800 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    <Cog size={16} />
                  </button>
                </div>
                <p className="text-xs text-ink-400 mt-1.5">
                  El sistema sugiere este porcentaje de la ganancia neta mensual como retiro del dueño, manteniendo el capital del negocio intacto.
                </p>
              </div>
              <div className="pt-3 border-t border-ink-200 space-y-2 text-xs">
                <ConfigRow label="TNA por defecto" value={`${(state.config.defaultAnnualRate * 100).toFixed(0)}%`} />
                <ConfigRow label="Recargo por mora (mensual)" value={`${(state.config.lateFeePctPerMonth * 100).toFixed(0)}%`} />
                <ConfigRow label="Máx. préstamo / capital" value={`${state.config.maxLoanToCapitalPct}%`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowNode({ icon, label, sublabel, tone }: { icon: React.ReactNode; label: string; sublabel: string; tone: 'brand' | 'accent' | 'info' | 'positive' }) {
  const styles = {
    brand: 'bg-brand-800 text-white border-brand-700',
    accent: 'bg-brand-50 text-brand-800 border-brand-300',
    info: 'bg-ink-100 text-ink-700 border-ink-300',
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  }[tone];
  return (
    <div className={`flex-1 min-w-[140px] rounded-xl border p-4 text-center transition-transform hover:scale-105 ${styles}`}>
      <div className="inline-flex p-2 rounded-lg bg-white/20 mb-2">{icon}</div>
      <p className="text-sm font-bold">{label}</p>
      <p className="text-[11px] opacity-75 mt-0.5">{sublabel}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center text-ink-300">
      <ArrowRight size={20} className="rotate-90 lg:rotate-0" />
    </div>
  );
}

function DbRow({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-ink-500">
        {icon}
        <span className="font-mono">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-ink-700 tabular-nums">{count}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-700 tabular-nums">{value}</span>
    </div>
  );
}
