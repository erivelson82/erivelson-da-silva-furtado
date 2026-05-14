import { Transaction, PendingAccount, InvestmentGoal, BudgetLimit, CreditCard } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'financapro_transactions',
  PENDING: 'financapro_pending',
  INVESTMENTS: 'financapro_investments',
  BUDGETS: 'financapro_budgets',
  CARDS: 'financapro_cards',
  SESSION: 'financapro_session',
  USERS: 'financapro_users'
};

export const storage = {
  getTransactions: (): Transaction[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return val ? JSON.parse(val) : [];
    } catch { return []; }
  },
  setTransactions: (data: Transaction[]) => localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data)),
  
  getPending: (): PendingAccount[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.PENDING);
      return val ? JSON.parse(val) : [];
    } catch { return []; }
  },
  setPending: (data: PendingAccount[]) => localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(data)),
  
  getInvestments: (): InvestmentGoal[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
      return val ? JSON.parse(val) : [];
    } catch { return []; }
  },
  setInvestments: (data: InvestmentGoal[]) => localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(data)),
  
  getBudgets: (): BudgetLimit[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return val ? JSON.parse(val) : [];
    } catch { return []; }
  },
  setBudgets: (data: BudgetLimit[]) => localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(data)),

  getCards: (): CreditCard[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.CARDS);
      return val ? JSON.parse(val) : [];
    } catch { return []; }
  },
  setCards: (data: CreditCard[]) => localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(data)),
  
  getSession: () => localStorage.getItem(STORAGE_KEYS.SESSION),
  setSession: (username: string | null) => {
    if (username) localStorage.setItem(STORAGE_KEYS.SESSION, username);
    else localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getUsers: (): any[] => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.USERS);
      return val ? JSON.parse(val) : [];
    } catch { return []; }
  },
  setUsers: (users: any[]) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)),

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.USERS) { // Keep registered users but clear their data
         localStorage.removeItem(key);
      }
    });
  }
};
