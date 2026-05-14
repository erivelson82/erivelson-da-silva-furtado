import React, { useState, useMemo } from 'react';
import { Save, AlertCircle, PieChart, TrendingDown } from 'lucide-react';
import { storage } from '../lib/storage';
import { BudgetLimit } from '../types';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const CATEGORIES = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Serviços", "Salário", "Investimento", "Outros"];

export default function Budget() {
  const [budgets, setBudgets] = useState<BudgetLimit[]>(() => {
    const saved = storage.getBudgets();
    return CATEGORIES.map(cat => ({
      category: cat,
      limit: saved.find(s => s.category === cat)?.limit || 0
    }));
  });

  const transactions = storage.getTransactions();

    const currentSpending = useMemo(() => {
    const spending: Record<string, number> = {};
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    transactions
      .filter(t => {
        if (t.type !== 'despesa') return false;
        try {
          const d = parseISO(t.date);
          return d instanceof Date && !isNaN(d.getTime()) && isWithinInterval(d, { start, end });
        } catch { return false; }
      })
      .forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      });

    return spending;
  }, [transactions]);

  const chartData = useMemo(() => {
    return budgets
      .filter(b => b.limit > 0 || (currentSpending[b.category] || 0) > 0)
      .map(b => ({
        category: b.category,
        Gasto: currentSpending[b.category] || 0,
        Limite: b.limit,
        percent: b.limit > 0 ? (currentSpending[b.category] || 0) / b.limit : 0
      }));
  }, [budgets, currentSpending]);

  const handleUpdateLimit = (category: string, value: string) => {
    const updated = budgets.map(b => 
      b.category === category ? { ...b, limit: parseFloat(value) || 0 } : b
    );
    setBudgets(updated);
  };

  const handleSave = () => {
    storage.setBudgets(budgets);
    alert('Orçamentos salvos com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 px-2 sm:px-0">
        <div className="card p-5 sm:p-8">
          <h3 className="text-base sm:text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
            <PieChart size={20} className="text-blue-600" />
            Metas de Gastos
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 sm:pr-2 scrollbar-hide mb-6">
            {budgets.map((b) => (
              <div key={b.category} className="flex items-center gap-3 group bg-slate-50/50 p-2 sm:p-3 rounded-xl border border-transparent hover:border-blue-100 transition-all">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-black text-slate-700 truncate">{b.category}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Gasto: R$ {(currentSpending[b.category] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-24 sm:w-32 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">R$</span>
                  <input 
                    type="number" 
                    value={b.limit || ''} 
                    onChange={e => handleUpdateLimit(b.category, e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs sm:text-sm font-black text-slate-900 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all" 
                  />
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={handleSave}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-500/10"
          >
            <Save size={18} />
            Salvar Configurações
          </button>
        </div>

        <div className="card flex flex-col p-5 sm:p-8">
          <h3 className="text-base sm:text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
            <TrendingDown size={20} className="text-rose-500" />
            Gasto vs Orçado
          </h3>
          <div className="flex-1 min-h-[300px] sm:min-h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} width={80} />
                <Tooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                />
                <Bar name="Gasto Atual" dataKey="Gasto" fill="#fbbf24" radius={[0, 10, 10, 0]} barSize={12} />
                <Bar name="Limite Definido" dataKey="Limite" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-50 space-y-2">
             {chartData.filter(d => d.percent >= 0.8 && d.Limite > 0).map(d => (
               <div key={d.category} className={cn(
                 "flex items-center gap-2 p-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all",
                 d.percent >= 1 ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-600 border border-amber-100"
               )}>
                 <AlertCircle size={14} className="shrink-0" />
                 <span>
                    {d.percent >= 1 
                      ? `Crítico: Limite de ${d.category} excedido em R$ ${(d.Gasto - d.Limite).toFixed(2)}` 
                      : `Alerta: ${d.category} atingiu ${(d.percent * 100).toFixed(0)}% do planejado.`
                    }
                 </span>
               </div>
             ))}
             {chartData.filter(d => d.percent >= 0.8 && d.Limite > 0).length === 0 && (
               <div className="text-center py-2">
                 <p className="text-[10px] font-bold text-slate-400 bg-slate-50 py-2 rounded-lg uppercase tracking-widest leading-none">
                    Todas as categorias estão sob controle
                 </p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
