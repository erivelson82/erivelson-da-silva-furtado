import React, { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Edit2, Filter, TrendingUp, TrendingDown, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { storage } from '../lib/storage';
import { Transaction, TransactionType } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Serviços", "Salário", "Investimento", "Outros"];

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getTransactions());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTx, setNewTx] = useState({
    description: '',
    amount: '',
    type: 'despesa' as TransactionType,
    category: 'Outros',
    date: new Date().toISOString().split('T')[0]
  });

  const resetForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setNewTx({
      description: '',
      amount: '',
      type: 'despesa',
      category: 'Outros',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditClick = (tx: Transaction) => {
    setEditingId(tx.id);
    setNewTx({
      description: tx.description,
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category,
      date: tx.date.split('T')[0]
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             tx.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || tx.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        try {
          const dateA = parseISO(a.date).getTime();
          const dateB = parseISO(b.date).getTime();
          return dateB - dateA;
        } catch {
          return 0;
        }
      });
  }, [transactions, searchTerm, typeFilter]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || !newTx.amount) return;

    if (editingId) {
      const updated = transactions.map(t => t.id === editingId ? {
        ...t,
        description: newTx.description,
        amount: parseFloat(newTx.amount),
        type: newTx.type,
        category: newTx.category,
        date: new Date(newTx.date).toISOString()
      } : t);
      setTransactions(updated);
      storage.setTransactions(updated);
    } else {
      const tx: Transaction = {
        id: Date.now().toString(),
        description: newTx.description,
        amount: parseFloat(newTx.amount),
        type: newTx.type,
        category: newTx.category,
        date: new Date(newTx.date).toISOString()
      };
      const updated = [tx, ...transactions];
      setTransactions(updated);
      storage.setTransactions(updated);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Excluir esta transação?')) return;
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    storage.setTransactions(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between">
        <div className="relative w-full sm:flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar transações..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            className="input-field flex-1 sm:w-32"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="despesa">Despesas</option>
          </select>
          <button 
            onClick={() => {
              if (showAddForm) resetForm();
              else setShowAddForm(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap min-w-[44px]"
          >
            {showAddForm ? <X size={18} /> : <Plus size={18} />}
            <span className={cn(showAddForm ? "" : "hidden sm:inline")}>
              {showAddForm ? 'Cancelar' : 'Nova'}
            </span>
            {!showAddForm && <span className="sm:hidden">Nova</span>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card bg-slate-50 border-blue-100 mb-6 p-4 sm:p-6">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
                {editingId ? 'Editar Transação' : 'Nova Transação'}
              </h3>
              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="lg:col-span-1">
                <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase mb-1 block">Tipo</label>
                <div className="flex p-1 bg-white border border-slate-200 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setNewTx({...newTx, type: 'entrada'})}
                    className={cn(
                      "flex-1 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all",
                      newTx.type === 'entrada' ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400"
                    )}
                  >
                    Entrada
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewTx({...newTx, type: 'despesa'})}
                    className={cn(
                      "flex-1 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all",
                      newTx.type === 'despesa' ? "bg-rose-500 text-white shadow-sm" : "text-slate-400"
                    )}
                  >
                    Despesa
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase mb-1 block">Descrição</label>
                <input 
                  type="text" 
                  value={newTx.description} 
                  onChange={e => setNewTx({...newTx, description: e.target.value})}
                  className="input-field" 
                  placeholder="Ex: Supermercado"
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase mb-1 block">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newTx.amount} 
                  onChange={e => setNewTx({...newTx, amount: e.target.value})}
                  className="input-field" 
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase mb-1 block">Categoria</label>
                <select 
                  value={newTx.category} 
                  onChange={e => setNewTx({...newTx, category: e.target.value})}
                  className="input-field"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-2 lg:col-span-1">
                <div className="flex-1">
                  <label className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase mb-1 block">Data</label>
                  <input 
                    type="date" 
                    value={newTx.date} 
                    onChange={e => setNewTx({...newTx, date: e.target.value})}
                    className="input-field" 
                  />
                </div>
                <button type="submit" className="btn-primary py-2.5 sm:py-2 px-6 shadow-md shadow-blue-500/10">Salvar</button>
              </div>
            </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={tx.id} 
            className="card p-3 sm:p-4 hover:border-blue-200 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                tx.type === 'entrada' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {tx.type === 'entrada' ? <TrendingUp size={18} className="sm:w-5 sm:h-5" /> : <TrendingDown size={18} className="sm:w-5 sm:h-5" />}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">{tx.description}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-slate-400">
                    {format(parseISO(tx.date), 'dd MMM yyyy', { locale: ptBR })}
                  </span>
                  <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                    {tx.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
              <span className={cn(
                "text-base sm:text-lg font-black tracking-tight",
                tx.type === 'entrada' ? "text-emerald-600" : "text-slate-900"
              )}>
                {tx.type === 'entrada' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => handleEditClick(tx)}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                >
                  <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
                <button 
                  onClick={() => handleDelete(tx.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="card py-12 text-center text-slate-400 italic">
            Nenhuma transação encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
