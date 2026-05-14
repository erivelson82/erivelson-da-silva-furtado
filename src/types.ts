export type TransactionType = 'entrada' | 'despesa';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string
}

export interface PendingAccount {
  id: string;
  description: string;
  amount: number;
  dueDate: string; // ISO string
  category: string;
  status: 'pendente' | 'pago';
}

export interface InvestmentGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: string; // ISO string
  category?: string;
}

export interface BudgetLimit {
  category: string;
  limit: number;
}

export interface CardPurchase {
  id: string;
  description: string;
  amount: number;
  installments: number;
  date: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currentBill: number;
  purchases: CardPurchase[];
}

export interface UserSession {
  username: string;
}
