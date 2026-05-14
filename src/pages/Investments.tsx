import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  TrendingUp, 
  Target, 
  Trash2, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plane, 
  Home, 
  Car, 
  HeartPulse, 
  Briefcase, 
  HelpCircle,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import { storage } from '../lib/storage';
import { InvestmentGoal } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORIES = [
  { id: 'viagem', label: 'Viagem', icon: Plane, color: 'text-blue-500 bg-blue-50' },
  { id: 'aposentadoria', label: 'Aposentadoria', icon: Briefcase, color: 'text-purple-500 bg-purple-50' },
  { id: 'reserva', label: 'Reserva de Emergência', icon: HeartPulse, color: 'text-rose-500 bg-rose-50' },
  { id: 'carro', label: 'Carro Novo', icon: Car, color: 'text-amber-500 bg-amber-50' },
  { id: 'casa', label: 'Casa Própria', icon: Home, color: 'text-emerald-500 bg-emerald-50' },
  { id: 'outro', label: 'Outro', icon: HelpCircle, color: 'text-slate-500 bg-slate-50' },
];

export default function Investments() {
  const [goals, setGoals] = useState<InvestmentGoal[]>(() => {
    const saved = storage.getInvestments();
    return saved.map(g => ({
      ...g,
      category: g.category || 'outro'
    }));
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ 
    name: '', 
    target: '', 
    category: 'reserva',
    customCategory: '',
    dueDate: '' 
  });
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [adjustmentValue, setAdjustmentValue] = useState<Record<string, string>>({});

  const totals = useMemo(() => {
    const goalList = goals || [];
    const invested = goalList.reduce((acc, g) => acc + (g.currentAmount || 0), 0);
    const target = goalList.reduce((acc, g) => acc + (g.targetAmount || 0), 0);
    return {
      invested,
      target,
      progress: target > 0 ? (invested / target) * 100 : 0
    };
  }, [goals]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target) return;
    
    const finalCategory = showCustomInput ? (newGoal.customCategory || 'Outro') : newGoal.category;

    const goal: InvestmentGoal = {
      id: Date.now().toString(),
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.target),
      currentAmount: 0,
      category: finalCategory,
      dueDate: newGoal.dueDate || undefined
    };
    const updated = [...goals, goal];
    setGoals(updated);
    storage.setInvestments(updated);
    setNewGoal({ name: '', target: '', category: 'reserva', customCategory: '', dueDate: '' });
    setShowCustomInput(false);
    setShowAddForm(false);
  };

  const handleAdjust = (id: string, type: 'add' | 'remove') => {
    const amount = parseFloat(adjustmentValue[id] || '0');
    if (isNaN(amount) || amount <= 0) return;

    const updated = goals.map(g => {
      if (g.id === id) {
        const newValue = type === 'add' ? g.currentAmount + amount : Math.max(0, g.currentAmount - amount);
        return { ...g, currentAmount: newValue };
      }
      return g;
    });

    setGoals(updated);
    storage.setInvestments(updated);
    setAdjustmentValue({ ...adjustmentValue, [id]: '' });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Excluir esta meta?')) return;
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    storage.setInvestments(updated);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Global Stats Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 card bg-slate-900 text-white border-none p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-500/10 rounded-full -mr-24 sm:-mr-32 -mt-24 sm:-mt-32 blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
            <div className="text-center sm:text-left">
              <p className="text-indigo-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2">Patrimônio em Metas</p>
              <h2 className="text-3xl sm:text-4xl font-black">
                R$ {totals.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-[280px] mx-auto sm:mx-0">
                Progresso de {(totals.progress).toFixed(1)}% rumo ao alvo de R$ {totals.target.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
               <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-800" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-indigo-500" strokeDasharray={`${totals.progress}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-base sm:text-lg">
                    {Math.round(totals.progress)}%
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="card border-dashed flex flex-col items-center justify-center text-center p-6 sm:p-8 gap-3 sm:gap-4 bg-slate-50/30">
          <div className="bg-indigo-50 text-indigo-600 p-3 sm:p-4 rounded-full shrink-0">
            <Plus size={28} className="sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">Nova Conquista?</h3>
            <p className="text-xs text-slate-500 mt-1">Defina um novo objetivo para o seu futuro.</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary w-full py-2.5 sm:py-3 shadow-lg shadow-indigo-500/10 text-xs sm:text-sm uppercase tracking-wider font-black"
          >
            Começar Nova Meta
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="px-2 sm:px-0">
            <form onSubmit={handleAddGoal} className="card bg-white border-indigo-100 shadow-xl p-5 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter">Novo Objetivo</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Planeje seu futuro próximo</p>
                </div>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome do Objetivo</label>
                  <input 
                    type="text" 
                    value={newGoal.name} 
                    onChange={e => setNewGoal({...newGoal, name: e.target.value})} 
                    className="input-field" 
                    placeholder="Ex: Liberdade Financeira" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valor Alvo (R$)</label>
                  <input 
                    type="number" 
                    step="100" 
                    value={newGoal.target} 
                    onChange={e => setNewGoal({...newGoal, target: e.target.value})} 
                    className="input-field" 
                    placeholder="0,00" 
                  />
                </div>
                <div className={cn(showCustomInput ? "lg:col-span-1" : "lg:col-span-2")}>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Categoria</label>
                  <select 
                    value={showCustomInput ? 'custom' : newGoal.category} 
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        setShowCustomInput(true);
                      } else {
                        setShowCustomInput(false);
                        setNewGoal({...newGoal, category: e.target.value});
                      }
                    }} 
                    className="input-field"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    <option value="custom">Personalizada...</option>
                  </select>
                </div>
                {showCustomInput && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome da Categoria</label>
                    <input 
                      type="text" 
                      value={newGoal.customCategory} 
                      onChange={e => setNewGoal({...newGoal, customCategory: e.target.value})} 
                      className="input-field" 
                      placeholder="Ex: Estudos" 
                    />
                  </div>
                )}
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Data de Desejo (Opcional)</label>
                  <input 
                    type="date" 
                    value={newGoal.dueDate} 
                    onChange={e => setNewGoal({...newGoal, dueDate: e.target.value})} 
                    className="input-field" 
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button type="submit" className="btn-primary w-full sm:w-auto px-12 py-3 text-xs sm:text-sm font-black shadow-xl shadow-indigo-500/10 uppercase tracking-widest">
                  Criar Objetivo
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-0">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const predefinedCat = CATEGORIES.find(c => c.id === goal.category);
          const cat = predefinedCat || { 
            id: 'custom', 
            label: goal.category || 'Outro', 
            icon: HelpCircle, 
            color: 'text-indigo-500 bg-indigo-50' 
          };
          const remaining = goal.targetAmount - goal.currentAmount;
          
          let monthlyEstimate = null;
          if (goal.dueDate && remaining > 0) {
            const months = Math.max(1, differenceInMonths(parseISO(goal.dueDate), new Date()));
            monthlyEstimate = remaining / months;
          }

          return (
            <motion.div layout key={goal.id} className="card border-none bg-white shadow-sm hover:shadow-md transition-shadow p-0 overflow-hidden flex flex-col group rounded-2xl">
              <div className="p-5 sm:p-6 pb-4">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shrink-0", cat.color)}>
                      <cat.icon size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    {!predefinedCat && (
                      <span className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg truncate max-w-[120px]">
                        {cat.label}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleDelete(goal.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-lg">
                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                </div>
                
                <h4 className="text-base sm:text-lg font-black text-slate-900 mb-4 truncate">{goal.name}</h4>
                
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                    R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-md">
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-1.5 sm:h-2 rounded-full overflow-hidden mb-6">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn(
                      "h-full rounded-full transition-all",
                      progress >= 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                    )} 
                  />
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between pt-4 border-t border-slate-50">
                    <div className="text-left min-w-0">
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Objetivo</p>
                      <p className="text-xs sm:text-sm font-black text-slate-700 truncate">R$ {goal.targetAmount.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right min-w-0 pl-2">
                      <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pendente</p>
                      <p className={cn(
                        "text-xs sm:text-sm font-black truncate",
                        remaining <= 0 ? 'text-emerald-500' : 'text-slate-700'
                      )}>
                        {remaining <= 0 ? 'Concluído!' : `R$ ${remaining.toLocaleString('pt-BR')}`}
                      </p>
                    </div>
                  </div>

                  {goal.dueDate && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-500 shrink-0" />
                        <span>Prazo: {format(parseISO(goal.dueDate), 'MM/yyyy')}</span>
                      </div>
                      {monthlyEstimate && remaining > 0 && (
                        <div className="sm:ml-auto text-indigo-600 font-black border-t sm:border-t-0 sm:border-l border-slate-200 pt-1.5 sm:pt-0 sm:pl-2.5">
                           ~ R$ {monthlyEstimate.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto p-4 bg-slate-50/50 border-t border-slate-50">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">R$</span>
                    <input 
                      type="number" 
                      value={adjustmentValue[goal.id] || ''} 
                      onChange={e => setAdjustmentValue({ ...adjustmentValue, [goal.id]: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm font-black focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" 
                      placeholder="Valor"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleAdjust(goal.id, 'add')}
                      title="Investir"
                      className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                      <ArrowUpCircle size={20} />
                    </button>
                    <button 
                      onClick={() => handleAdjust(goal.id, 'remove')}
                      title="Retirar"
                      className="bg-white border border-slate-200 text-slate-400 p-2.5 rounded-xl hover:bg-slate-50 transition-colors active:scale-95"
                    >
                      <ArrowDownCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full py-20 text-center card bg-slate-50 border-dashed">
            <TrendingUp size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400 italic">Nenhum objetivo traçado ainda. Onde você quer estar daqui a 5 anos?</p>
          </div>
        )}
      </div>
    </div>
  );
}
