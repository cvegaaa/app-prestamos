export type ID = string;

export interface Client {
  id: ID;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  address: string;
  city: string;
  creditScore: number; // 0-1000
  status: 'active' | 'blacklisted';
  createdAt: string;
}

export type LoanStatus = 'active' | 'finished' | 'defaulted';
export type InstallmentStatus = 'pending' | 'paid' | 'late' | 'cancelled';

export interface Installment {
  id: ID;
  loanId: ID;
  number: number;
  dueDate: string; // ISO date
  totalAmount: number; // capital + interest portion
  interestAmount: number;
  capitalAmount: number;
  status: InstallmentStatus;
  paidAt: string | null;
}

export interface Loan {
  id: ID;
  clientId: ID;
  principal: number; // capital prestado
  termMonths: number;
  annualRate: number; // e.g. 0.45 = 45% annual
  monthlyPayment: number;
  totalToPay: number;
  totalInterest: number;
  startDate: string;
  status: LoanStatus;
}

export type ExpenseCategory =
  | 'monotributo'
  | 'accountant'
  | 'stamps'
  | 'administrative'
  | 'operational';

export interface Expense {
  id: ID;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string; // ISO date
}

export interface SystemLog {
  id: ID;
  timestamp: string;
  level: 'INFO' | 'AUTO' | 'WARN' | 'ERROR';
  module: string;
  message: string;
}

export interface Config {
  ownerWithdrawalPct: number; // suggested % of net profit for owner withdrawal
  maxLoanToCapitalPct: number;
  defaultAnnualRate: number;
  lateFeePctPerMonth: number;
}

export interface AppState {
  clients: Client[];
  loans: Loan[];
  installments: Installment[];
  expenses: Expense[];
  logs: SystemLog[];
  config: Config;
}
