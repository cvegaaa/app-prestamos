import type { Loan, Installment } from '@/types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatCurrencyPrecise(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-AR').format(value);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// French amortization system: fixed monthly payment, interest on outstanding balance
export function calcAmortization(
  principal: number,
  annualRate: number,
  termMonths: number
): { monthlyPayment: number; totalToPay: number; totalInterest: number; schedule: { capital: number; interest: number; total: number; balance: number }[] } {
  const monthlyRate = annualRate / 12;
  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = principal / termMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, termMonths);
    monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
  }

  const schedule: { capital: number; interest: number; total: number; balance: number }[] = [];
  let balance = principal;
  let totalInterest = 0;
  for (let i = 1; i <= termMonths; i++) {
    const interest = balance * monthlyRate;
    let capital = monthlyPayment - interest;
    if (i === termMonths) {
      capital = balance; // adjust last installment to clear balance
    }
    balance -= capital;
    totalInterest += interest;
    schedule.push({
      capital,
      interest,
      total: capital + interest,
      balance: Math.max(0, balance),
    });
  }

  const totalToPay = principal + totalInterest;
  return { monthlyPayment, totalToPay, totalInterest, schedule };
}

export interface LoanMetrics {
  recovered: number; // capital recovered
  interestCollected: number;
  outstanding: number; // remaining principal to recover
  paidInstallments: number;
  totalInstallments: number;
  lateInstallments: number;
}

export function computeLoanMetrics(loan: Loan, installments: Installment[]): LoanMetrics {
  const loanInstallments = installments.filter((i) => i.loanId === loan.id);
  let recovered = 0;
  let interestCollected = 0;
  let paidInstallments = 0;
  let lateInstallments = 0;
  for (const inst of loanInstallments) {
    if (inst.status === 'paid') {
      recovered += inst.capitalAmount;
      interestCollected += inst.interestAmount;
      paidInstallments++;
    } else if (inst.status === 'late') {
      lateInstallments++;
    }
  }
  const outstanding = loan.principal - recovered;
  return {
    recovered,
    interestCollected,
    outstanding: Math.max(0, outstanding),
    paidInstallments,
    totalInstallments: loanInstallments.length,
    lateInstallments,
  };
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
