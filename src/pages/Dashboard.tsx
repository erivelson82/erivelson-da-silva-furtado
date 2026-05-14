import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ChevronRight,
  TrendingUp as InvestIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { storage } from '../lib/storage';
import { Transaction, InvestmentGoal, CreditCard } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, Plus } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const transactions = storage.getTransactions();
  const goals = storage.getInvestments();
  const cards = storage.getCards();
  const [metaValue, setMetaValue] = useState(() => Number(localStorage.getItem('financa_meta_economia') || '0'));

  const handleResetData = () => {
    if (confirm('Tem certeza que deseja apagar TODOS os seus dados? Esta ação não pode ser desfeita.')) {
      storage.clearAll();
      window.location.reload();
    }
  };

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'entrada')
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    const monthIncome = transactions
      .filter(t => {
        if (t.type !== 'entrada') return false;
        try {
          const d = parseISO(t.date);
          return d instanceof Date && !isNaN(d.getTime()) && isWithinInterval(d, { start: currentMonthStart, end: currentMonthEnd });
        } catch { return false; }
      })
      .reduce((acc, t) => acc + t.amount, 0);
      
    const monthExpenses = transactions
      .filter(t => {
        if (t.type !== 'despesa') return false;
        try {
          const d = parseISO(t.date);
          return d instanceof Date && !isNaN(d.getTime()) && isWithinInterval(d, { start: currentMonthStart, end: currentMonthEnd });
        } catch { return false; }
      })
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      monthIncome,
      monthExpenses,
      monthBalance: monthIncome - monthExpenses
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const income = transactions
        .filter(t => {
          if (t.type !== 'entrada') return false;
          try {
            const d = parseISO(t.date);
            return d instanceof Date && !isNaN(d.getTime()) && isWithinInterval(d, { start, end });
          } catch { return false; }
        })
        .reduce((acc, t) => acc + t.amount, 0);
      const expenses = transactions
        .filter(t => {
          if (t.type !== 'despesa') return false;
          try {
            const d = parseISO(t.date);
            return d instanceof Date && !isNaN(d.getTime()) && isWithinInterval(d, { start, end });
          } catch { return false; }
        })
        .reduce((acc, t) => acc + t.amount, 0);

      data.push({
        name: format(date, 'MMM', { locale: ptBR }),
        income,
        expenses,
        balance: income - expenses
      });
    }
    return data;
  }, [transactions]);

  const topExpenses = useMemo(() => {
    const categories: Record<string, number> = {};
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    transactions
      .filter(t => {
        if (t.type !== 'despesa') return false;
        try {
          const d = parseISO(t.date);
          return d instanceof Date && !isNaN(d.getTime()) && isWithinInterval(d, { start: monthStart, end: monthEnd });
        } catch { return false; }
      })
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [transactions]);

  const handleMetaSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    localStorage.setItem('financa_meta_economia', metaValue.toString());
    alert('Meta salva!');
  };

  const economyProgress = stats.monthBalance > 0 ? Math.min(100, (stats.monthBalance / metaValue) * 100) : 0;

  return (
    <div className="space-y-8">
      {transactions.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-500/20 mb-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          <div className="relative z-10 max-w-lg">
            <h1 className="text-3xl font-black mb-3">Bem-vindo ao FinançaPro!</h1>
            <p className="text-blue-100 font-medium mb-6">
              Seu aplicativo está limpo e pronto para uso. Comece adicionando suas primeiras transações ou cartões para ver seu dashboard ganhar vida.
            </p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => navigate('/transactions')}
                className="bg-white text-blue-600 px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <Plus size={18} /> Nova Transação
              </button>
              <button 
                onClick={() => navigate('/import')}
                className="bg-blue-500 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-blue-400 border border-blue-400 transition-all flex items-center gap-2"
              >
                <ArrowUpCircle size={18} /> Importar Extrato
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card flex items-center gap-4 sm:gap-5 border-l-4 border-l-emerald-500">
          <div className="bg-emerald-50 text-emerald-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
            <TrendingUp size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Entradas</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 truncate">
              R$ {stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card flex items-center gap-4 sm:gap-5 border-l-4 border-l-rose-500">
          <div className="bg-rose-50 text-rose-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
            <TrendingDown size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Despesas</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 truncate">
              R$ {stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card flex items-center gap-4 sm:gap-5 border-l-4 border-l-blue-500">
          <div className="bg-blue-50 text-blue-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
            <Wallet size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Saldo Geral</p>
            <p className={cn("text-xl sm:text-2xl font-black mt-0.5 truncate", stats.balance >= 0 ? "text-slate-900" : "text-rose-600")}>
              R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card flex flex-col gap-3 sm:gap-4 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="bg-amber-50 text-amber-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
              <Target size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Meta Econ.</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                   {economyProgress.toFixed(0)}%
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">concluído</span>
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 sm:h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-700 ease-out rounded-full" 
              style={{ width: `${economyProgress}%` }}
            />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Main Chart */}
          <div className="card h-[300px] sm:h-[400px]">
            <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600 sm:w-5 sm:h-5" />
              Evolução Financeira
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="income" name="Entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Details */}
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Resumo do Mês</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                  <span className="text-sm font-medium text-emerald-700">Ganhos</span>
                  <span className="font-bold text-emerald-700">R$ {stats.monthIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-rose-50 rounded-xl">
                  <span className="text-sm font-medium text-rose-700">Gastos</span>
                  <span className="font-bold text-rose-700">R$ {stats.monthExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm font-medium text-blue-700">Saldo do Mês</span>
                  <span className="font-bold text-blue-700">R$ {stats.monthBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Set Meta */}
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Meta de Economia</h3>
              <form onSubmit={handleMetaSave} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                    Definir Valor Mensal (R$)
                  </label>
                  <input 
                    type="number" 
                    value={metaValue} 
                    onChange={e => setMetaValue(Number(e.target.value))}
                    className="input-field"
                    placeholder="0,00"
                  />
                </div>
                <button type="submit" className="btn-primary w-full shadow-lg shadow-blue-500/20">
                  Atualizar Meta
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Investment Goals Summary */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <InvestIcon size={20} className="text-indigo-500" />
                Meus Objetivos
              </h3>
              <button 
                onClick={() => navigate('/investments')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Ver todos <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="space-y-5">
              {goals.length > 0 ? goals.slice(0, 3).map((goal) => {
                const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-bold text-slate-700">{goal.name}</p>
                      <p className="text-xs font-black text-slate-400">{Math.round(progress)}%</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-1000" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-sm text-slate-400 mb-3">Nenhum objetivo definido</p>
                  <button 
                    onClick={() => navigate('/investments')}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors"
                  >
                    Criar primeiro objetivo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Credit Cards Summary */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingDown size={20} className="text-blue-600" />
                Resumo de Cartões
              </h3>
              <button 
                onClick={() => navigate('/cards')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Ver cartões <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="space-y-5">
              {cards.length > 0 ? cards.map((card) => {
                const totalSpent = (card.purchases || []).reduce((acc, p) => acc + p.amount, 0);
                const available = card.limit - totalSpent;
                const progress = Math.min(100, (totalSpent / card.limit) * 100);

                return (
                  <div key={card.id} className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{card.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Disp. R$ {available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Limite R$ {card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          progress > 90 ? "bg-rose-500" : progress > 70 ? "bg-amber-500" : "bg-blue-600"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-sm text-slate-400 mb-3">Nenhum cartão cadastrado</p>
                  <button 
                    onClick={() => navigate('/cards')}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                  >
                    Adicionar cartão
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Top Expenses */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingDown size={20} className="text-rose-500" />
              Maiores Despesas (Mês)
            </h3>
            <div className="space-y-4">
              {topExpenses.length > 0 ? topExpenses.map(([cat, val]) => (
                <div key={cat} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{cat}</p>
                    <p className="text-xs text-slate-400">Total gasto</p>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">R$ {val.toFixed(2)}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic text-center py-4">Nenhuma despesa este mês.</p>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="card bg-blue-600 text-white border-none">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={24} />
              <h3 className="font-bold">Dica Financeira</h3>
            </div>
            <p className="text-sm text-blue-100 leading-relaxed">
              Tente manter suas despesas fixas em até 50% da sua renda mensal. Isso garante maior fôlego para investimentos e lazer.
            </p>
          </div>

          {/* Danger Zone */}
          <div className="card border-dashed border-rose-200 bg-rose-50/30">
            <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle size={16} />
              Zona de Perigo
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Deseja começar do zero? Esta ação apagará todas as transações, cartões e metas.
            </p>
            <button 
              onClick={handleResetData}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-rose-100 text-rose-600 text-xs font-black rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              <Trash2 size={14} />
              LIMPAR TODOS OS DADOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
