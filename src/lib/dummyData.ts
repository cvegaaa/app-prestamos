import type { AppState, Client, Loan, Installment, Expense, SystemLog, Config } from '@/types';
import { calcAmortization, uid } from '@/lib/finance';

const config: Config = {
  ownerWithdrawalPct: 40,
  maxLoanToCapitalPct: 75,
  defaultAnnualRate: 0.6,
  lateFeePctPerMonth: 0.05,
};

const firstNames = ['Juan', 'María', 'Carlos', 'Sofía', 'Martín', 'Lucía', 'Diego', 'Valentina', 'Fernando', 'Camila', 'Andrés', 'Florencia', 'Pablo', 'Micaela', 'Gustavo', 'Agustina'];
const lastNames = ['Pérez', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Romero', 'Sosa', 'Torres', 'Díaz', 'Ruiz', 'Acosta', 'Benítez', 'Medina', 'Suárez'];
const cities = ['Rosario', 'Funes', 'Villa Gobernador Gálvez', 'Granadero Baigorria', 'Pérez', 'Zavalla'];
const streets = ['San Martín', 'Corrientes', 'Mitre', 'Belgrano', 'Sarmiento', 'Rivadavia', 'Pellegrini', 'Oroño', 'Bv. 27 de Febrero', 'Tucumán'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function monthsAgo(months: number, day = 1): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(day);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

function generateClients(): Client[] {
  const clients: Client[] = [];
  for (let i = 0; i < 12; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const dni = String(20000000 + Math.floor(Math.random() * 25000000));
    clients.push({
      id: `cli-${(i + 1).toString().padStart(3, '0')}`,
      firstName,
      lastName,
      dni,
      phone: `341${Math.floor(1000000 + Math.random() * 8999999)}`,
      address: `${pick(streets)} ${Math.floor(100 + Math.random() * 3900)}`,
      city: pick(cities),
      creditScore: 450 + Math.floor(Math.random() * 550),
      status: i === 11 ? 'blacklisted' : 'active',
      createdAt: monthsAgo(6 + i, 5),
    });
  }
  return clients;
}

function generateLoansAndInstallments(clients: Client[]): { loans: Loan[]; installments: Installment[] } {
  const loans: Loan[] = [];
  const installments: Installment[] = [];

  // Deterministic-ish demo loans for narrative clarity
  const scenarios: { clientIdx: number; principal: number; term: number; rate: number; startMonthsAgo: number; status: 'active' | 'finished' | 'defaulted' }[] = [
    { clientIdx: 0, principal: 500000, term: 12, rate: 0.6, startMonthsAgo: 4, status: 'active' },
    { clientIdx: 0, principal: 200000, term: 6, rate: 0.55, startMonthsAgo: 8, status: 'finished' },
    { clientIdx: 1, principal: 800000, term: 18, rate: 0.65, startMonthsAgo: 3, status: 'active' },
    { clientIdx: 2, principal: 350000, term: 12, rate: 0.6, startMonthsAgo: 5, status: 'active' },
    { clientIdx: 3, principal: 150000, term: 6, rate: 0.5, startMonthsAgo: 2, status: 'active' },
    { clientIdx: 4, principal: 1200000, term: 24, rate: 0.7, startMonthsAgo: 7, status: 'active' },
    { clientIdx: 5, principal: 400000, term: 12, rate: 0.6, startMonthsAgo: 6, status: 'active' },
    { clientIdx: 6, principal: 250000, term: 8, rate: 0.58, startMonthsAgo: 10, status: 'finished' },
    { clientIdx: 7, principal: 600000, term: 12, rate: 0.62, startMonthsAgo: 4, status: 'active' },
    { clientIdx: 8, principal: 300000, term: 6, rate: 0.55, startMonthsAgo: 3, status: 'defaulted' },
    { clientIdx: 9, principal: 900000, term: 18, rate: 0.65, startMonthsAgo: 5, status: 'active' },
    { clientIdx: 10, principal: 180000, term: 6, rate: 0.5, startMonthsAgo: 1, status: 'active' },
  ];

  scenarios.forEach((s, idx) => {
    const client = clients[s.clientIdx];
    const startDate = monthsAgo(s.startMonthsAgo, 5);
    const { monthlyPayment, totalToPay, totalInterest, schedule } = calcAmortization(s.principal, s.rate, s.term);

    const loanId = `loan-${(idx + 1).toString().padStart(3, '0')}`;
    loans.push({
      id: loanId,
      clientId: client.id,
      principal: s.principal,
      termMonths: s.term,
      annualRate: s.rate,
      monthlyPayment,
      totalToPay,
      totalInterest,
      startDate,
      status: s.status,
    });

    // Generate installments with dates
    const start = new Date(startDate);
    schedule.forEach((row, i) => {
      const due = new Date(start);
      due.setMonth(due.getMonth() + (i + 1));
      due.setDate(5);

      const now = new Date();
      let status: Installment['status'] = 'pending';
      let paidAt: string | null = null;

      if (s.status === 'finished') {
        status = 'paid';
        paidAt = due.toISOString();
      } else if (s.status === 'defaulted' && i >= 2) {
        // defaulted: first 2 paid, rest late
        status = i < 2 ? 'paid' : 'late';
        paidAt = i < 2 ? due.toISOString() : null;
      } else {
        // active: installments with due date before now are paid (mostly)
        if (due < now) {
          // 85% paid, 15% late for past due
          const isLate = i === Math.floor(s.term / 2) && s.startMonthsAgo > 3;
          status = isLate ? 'late' : 'paid';
          paidAt = isLate ? null : due.toISOString();
        } else {
          status = 'pending';
        }
      }

      installments.push({
        id: uid('inst'),
        loanId,
        number: i + 1,
        dueDate: due.toISOString(),
        totalAmount: row.total,
        interestAmount: row.interest,
        capitalAmount: row.capital,
        status,
        paidAt,
      });
    });
  });

  return { loans, installments };
}

function generateExpenses(): Expense[] {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const expenses: Expense[] = [
    { id: uid('exp'), category: 'monotributo', description: 'Monotributo categoría C - mensual', amount: 38000, date: new Date(thisYear, thisMonth, 10).toISOString() },
    { id: uid('exp'), category: 'accountant', description: 'Honorarios contador - liquidación mensual', amount: 65000, date: new Date(thisYear, thisMonth, 5).toISOString() },
    { id: uid('exp'), category: 'accountant', description: 'Honorarios abogado - cobro prejudicial', amount: 45000, date: new Date(thisYear, thisMonth, 15).toISOString() },
    { id: uid('exp'), category: 'stamps', description: 'Sellados contrato préstamo loan-004', amount: 12000, date: new Date(thisYear, thisMonth, 8).toISOString() },
    { id: uid('exp'), category: 'stamps', description: 'Sellados contrato préstamo loan-009', amount: 18000, date: new Date(thisYear, thisMonth, 12).toISOString() },
    { id: uid('exp'), category: 'administrative', description: 'Insumos de oficina - impresión y fotocopias', amount: 8500, date: new Date(thisYear, thisMonth, 3).toISOString() },
    { id: uid('exp'), category: 'administrative', description: 'Suscripción software de gestión', amount: 22000, date: new Date(thisYear, thisMonth, 1).toISOString() },
    { id: uid('exp'), category: 'operational', description: 'Combustible y movilidad - cobranzas', amount: 28000, date: new Date(thisYear, thisMonth, 18).toISOString() },
    // last month for comparison
    { id: uid('exp'), category: 'monotributo', description: 'Monotributo categoría C - mensual', amount: 38000, date: new Date(thisYear, thisMonth - 1, 10).toISOString() },
    { id: uid('exp'), category: 'accountant', description: 'Honorarios contador - liquidación mensual', amount: 65000, date: new Date(thisYear, thisMonth - 1, 5).toISOString() },
    { id: uid('exp'), category: 'operational', description: 'Combustible y movilidad - cobranzas', amount: 24000, date: new Date(thisYear, thisMonth - 1, 18).toISOString() },
  ];
  return expenses;
}

function generateLogs(): SystemLog[] {
  const base = new Date();
  const logs: SystemLog[] = [];
  const entries: { level: SystemLog['level']; module: string; message: string; minsAgo: number }[] = [
    { level: 'AUTO', module: 'AMORTization', message: 'AUTO_CALC: Separación de amortización cuota #4 Préstamo ID-003 completada exitosamente', minsAgo: 3 },
    { level: 'INFO', module: 'Payment', message: 'Cobro registrado: Cuota #2 Préstamo loan-001 — $48.917 abonado (Cap. $31.250 + Int. $17.667)', minsAgo: 18 },
    { level: 'AUTO', module: 'KPI', message: 'Recálculo de KPIs de caja: Ganancia neta mensual actualizada a $1.284.500', minsAgo: 19 },
    { level: 'WARN', module: 'LateDetect', message: 'Cuota #3 Préstamo loan-008 marcada como ATRASADA (vencimiento 05/07/2026)', minsAgo: 120 },
    { level: 'INFO', module: 'Client', message: 'Nuevo cliente creado: DNI 28.456.123 — Score crediticio inicial 720', minsAgo: 240 },
    { level: 'AUTO', module: 'Amortization', message: 'AUTO_CALC: Separación de amortización cuota #1 Préstamo ID-012 completada exitosamente', minsAgo: 300 },
    { level: 'INFO', module: 'Expense', message: 'Gasto registrado: Honorarios abogado — $45.000 impacta rentabilidad mes actual', minsAgo: 360 },
    { level: 'WARN', module: 'Risk', message: 'Préstamo loan-008 entró en estado EN MORA tras 3 cuotas impagas', minsAgo: 480 },
    { level: 'AUTO', module: 'Amortization', message: 'AUTO_CALC: Separación de amortización cuota #6 Préstamo ID-005 completada exitosamente', minsAgo: 600 },
    { level: 'INFO', module: 'Loan', message: 'Préstamo loan-011 desembolsado: $900.000 a 18 cuotas — TNA 65%', minsAgo: 720 },
    { level: 'ERROR', module: 'Storage', message: 'Intento de escritura duplicada detectado y descartado (installment id colisión)', minsAgo: 900 },
    { level: 'AUTO', module: 'OwnerDraw', message: 'Sugerencia de retiro del dueño recalculada: 40% de ganancia neta = $513.800', minsAgo: 1440 },
  ];
  entries.forEach((e) => {
    const t = new Date(base.getTime() - e.minsAgo * 60000);
    logs.push({
      id: uid('log'),
      timestamp: t.toISOString(),
      level: e.level,
      module: e.module,
      message: e.message,
    });
  });
  return logs;
}

export function createInitialState(): AppState {
  const clients = generateClients();
  const { loans, installments } = generateLoansAndInstallments(clients);
  const expenses = generateExpenses();
  const logs = generateLogs();
  return { clients, loans, installments, expenses, logs, config };
}

// 6-month historical series for the dashboard chart
export function getMonthlySeries(): { month: string; lent: number; recovered: number; net: number }[] {
  return [
    { month: 'Mar', lent: 1450000, recovered: 980000, net: 410000 },
    { month: 'Abr', lent: 1820000, recovered: 1240000, net: 520000 },
    { month: 'May', lent: 2100000, recovered: 1560000, net: 680000 },
    { month: 'Jun', lent: 1750000, recovered: 1420000, net: 590000 },
    { month: 'Jul', lent: 2380000, recovered: 1710000, net: 820000 },
    { month: 'Ago', lent: 2640000, recovered: 1980000, net: 1010000 },
  ];
}
