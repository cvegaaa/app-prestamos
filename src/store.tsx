import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { AppState, Client, Loan, Installment, Expense, SystemLog, Config } from '@/types';
import { createInitialState } from '@/lib/dummyData';
import { calcAmortization, computeLoanMetrics, uid } from '@/lib/finance';

type Action =
  | { type: 'ADD_CLIENT'; client: Client }
  | { type: 'ADD_LOAN'; loan: Loan; installments: Installment[] }
  | { type: 'PAY_INSTALLMENT'; installmentId: string }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'UPDATE_CONFIG'; config: Partial<Config> }
  | { type: 'ADD_LOG'; log: SystemLog };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_CLIENT':
      return { ...state, clients: [action.client, ...state.clients] };
    case 'ADD_LOAN':
      return {
        ...state,
        loans: [action.loan, ...state.loans],
        installments: [...state.installments, ...action.installments],
      };
    case 'PAY_INSTALLMENT': {
      const installments = state.installments.map((i) =>
        i.id === action.installmentId
          ? { ...i, status: 'paid' as const, paidAt: new Date().toISOString() }
          : i
      );
      // Check if loan is fully paid
      const target = installments.find((i) => i.id === action.installmentId);
      let loans = state.loans;
      if (target) {
        const loanInstallments = installments.filter((i) => i.loanId === target.loanId);
        const allPaid = loanInstallments.every((i) => i.status === 'paid');
        if (allPaid) {
          loans = loans.map((l) => (l.id === target.loanId ? { ...l, status: 'finished' as const } : l));
        }
      }
      return { ...state, installments, loans };
    }
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.expense, ...state.expenses] };
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) };
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.config } };
    case 'ADD_LOG':
      return { ...state, logs: [action.log, ...state.logs] };
    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  addClient: (c: Omit<Client, 'id' | 'createdAt' | 'status' | 'creditScore'> & { creditScore?: number }) => void;
  addLoan: (clientId: string, principal: number, termMonths: number, annualRate: number) => Loan;
  payInstallment: (id: string) => void;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  updateConfig: (c: Partial<Config>) => void;
  getClient: (id: string) => Client | undefined;
  getLoan: (id: string) => Loan | undefined;
  getClientLoans: (clientId: string) => Loan[];
  getLoanInstallments: (loanId: string) => Installment[];
  getLoanMetrics: (loanId: string) => ReturnType<typeof computeLoanMetrics>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const addLog = (level: SystemLog['level'], module: string, message: string) => {
    dispatch({
      type: 'ADD_LOG',
      log: { id: uid('log'), timestamp: new Date().toISOString(), level, module, message },
    });
  };

  const value: StoreContextValue = {
    state,
    addClient: (c) => {
      const client: Client = {
        id: uid('cli'),
        createdAt: new Date().toISOString(),
        status: 'active',
        creditScore: c.creditScore ?? 650,
        ...c,
      };
      dispatch({ type: 'ADD_CLIENT', client });
      addLog('INFO', 'Client', `Nuevo cliente creado: DNI ${c.dni} — Score crediticio inicial ${client.creditScore}`);
    },
    addLoan: (clientId, principal, termMonths, annualRate) => {
      const { monthlyPayment, totalToPay, totalInterest, schedule } = calcAmortization(principal, annualRate, termMonths);
      const loanId = uid('loan');
      const loan: Loan = {
        id: loanId,
        clientId,
        principal,
        termMonths,
        annualRate,
        monthlyPayment,
        totalToPay,
        totalInterest,
        startDate: new Date().toISOString(),
        status: 'active',
      };
      const start = new Date();
      const installments: Installment[] = schedule.map((row, i) => {
        const due = new Date(start);
        due.setMonth(due.getMonth() + (i + 1));
        due.setDate(5);
        return {
          id: uid('inst'),
          loanId,
          number: i + 1,
          dueDate: due.toISOString(),
          totalAmount: row.total,
          interestAmount: row.interest,
          capitalAmount: row.capital,
          status: 'pending',
          paidAt: null,
        };
      });
      dispatch({ type: 'ADD_LOAN', loan, installments });
      addLog('INFO', 'Loan', `Préstamo ${loanId} desembolsado: $${principal.toLocaleString('es-AR')} a ${termMonths} cuotas — TNA ${(annualRate * 100).toFixed(0)}%`);
      addLog('AUTO', 'Amortization', `AUTO_CALC: Generadas ${termMonths} cuotas con amortización sistema francés — cuota fija $${Math.round(monthlyPayment).toLocaleString('es-AR')}`);
      return loan;
    },
    payInstallment: (id) => {
      const inst = state.installments.find((i) => i.id === id);
      dispatch({ type: 'PAY_INSTALLMENT', installmentId: id });
      if (inst) {
        addLog('INFO', 'Payment', `Cobro registrado: Cuota #${inst.number} Préstamo ${inst.loanId} — $${Math.round(inst.totalAmount).toLocaleString('es-AR')} abonado (Cap. $${Math.round(inst.capitalAmount).toLocaleString('es-AR')} + Int. $${Math.round(inst.interestAmount).toLocaleString('es-AR')})`);
        addLog('AUTO', 'KPI', `Recálculo de KPIs de caja: capital recuperado e interés cobrado actualizados`);
      }
    },
    addExpense: (e) => {
      const expense: Expense = { ...e, id: uid('exp') };
      dispatch({ type: 'ADD_EXPENSE', expense });
      addLog('INFO', 'Expense', `Gasto registrado: ${e.description} — $${e.amount.toLocaleString('es-AR')} impacta rentabilidad mes actual`);
    },
    deleteExpense: (id) => dispatch({ type: 'DELETE_EXPENSE', id }),
    updateConfig: (c) => {
      dispatch({ type: 'UPDATE_CONFIG', config: c });
      addLog('AUTO', 'OwnerDraw', `Configuración actualizada: retiro sugerido ${c.ownerWithdrawalPct ?? state.config.ownerWithdrawalPct}% de ganancia neta`);
    },
    getClient: (id) => state.clients.find((c) => c.id === id),
    getLoan: (id) => state.loans.find((l) => l.id === id),
    getClientLoans: (clientId) => state.loans.filter((l) => l.clientId === clientId),
    getLoanInstallments: (loanId) => state.installments.filter((i) => i.loanId === loanId).sort((a, b) => a.number - b.number),
    getLoanMetrics: (loanId) => {
      const loan = state.loans.find((l) => l.id === loanId);
      if (!loan) return { recovered: 0, interestCollected: 0, outstanding: 0, paidInstallments: 0, totalInstallments: 0, lateInstallments: 0 };
      return computeLoanMetrics(loan, state.installments);
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
