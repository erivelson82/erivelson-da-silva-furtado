import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle, Clock, Trash2, Calendar, Tags, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { storage } from '../lib/storage';
import { PendingAccount, Transaction } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Serviços", "Salário", "Investimento", "Outros"];

export default function Pending() {
  const [pending, setPending] = useState<PendingAccount[]>(() => storage.getPending());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAcc, setNewAcc] = useState({
    description: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    category: 'Moradia'
  });

  const stats = useMemo(() => {
    const active = pending.filter(p => p.status === 'pendente');
    return {
      totalActive: active.length,
      totalAmount: active.reduce((acc, p) => acc + p.amount, 0),
    };
  }, [pending]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcc.description || !newAcc.amount || !newAcc.dueDate) return;

    const acc: PendingAccount = {
      id: Date.now().toString(),
      description: newAcc.description,
      amount: parseFloat(newAcc.amount),
      dueDate: new Date(newAcc.dueDate).toISOString(),
      category: newAcc.category,
      status: 'pendente'
    };

    const updated = [acc, ...pending];
    setPending(updated);
    storage.setPending(updated);
    setShowAddForm(false);
    setNewAcc({
      description: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      category: 'Moradia'
    });
  };

  const handlePay = (id: string) => {
    const current = [...pending];
    const idx = current.findIndex(p => p.id === id);
    if (idx === -1) return;

    const p = current[idx];
    if (p.status === 'pago') return;

    const tx: Transaction = {
      id: Date.now().toString(),
      description: `Pagamento: ${p.description}`,
      amount: p.amount,
      type: 'despesa',
      category: p.category,
      date: new Date().toISOString()
    };
    
    const transactions = storage.getTransactions();
    storage.setTransactions([tx, ...transactions]);

    current[idx].status = 'pago';
    setPending(current);
    storage.setPending(current);
  };

  const handleTrash = (id: string) => {
    if (!window.confirm('Excluir esta conta?')) return;
    const updated = pending.filter(p => p.id !== id);
    setPending(updated);
    storage.setPending(updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-blue-600 text-white border-none flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Contas Pendentes</p>
            <p className="text-3xl font-black">{stats.totalActive}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl"><Clock size={32} /></div>
        </div>
        <div className="card bg-amber-500 text-white border-none flex items-center justify-between">
          <div>
            <p className="text-amber-100 text-sm font-medium uppercase tracking-wider">Total a Pagar</p>
            <p className="text-3xl font-black">R$ {stats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl"><DollarSign size={32} /></div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nova Conta
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
            <form onSubmit={handleAdd} className="card bg-white border-blue-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 shadow-xl">
              <div className="lg:col-span-1">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">Descrição</label>
                <input type="text" value={newAcc.description} onChange={e => setNewAcc({...newAcc, description: e.target.value})} className="input-field" placeholder="Ex: Aluguel" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">Valor</label>
                <input type="number" step="0.01" value={newAcc.amount} onChange={e => setNewAcc({...newAcc, amount: e.target.value})} className="input-field" placeholder="0,00" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">Vencimento</label>
                <input type="date" value={newAcc.dueDate} onChange={e => setNewAcc({...newAcc, dueDate: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">Categoria</label>
                <select value={newAcc.category} onChange={e => setNewAcc({...newAcc, category: e.target.value})} className="input-field">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-end"><button type="submit" className="btn-primary w-full py-2">Adicionar</button></div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {pending.length > 0 ? pending.filter(p => p.status === 'pendente').map((acc) => (
          <motion.div layout key={acc.id} className="card relative border-none shadow-soft hover:shadow-md overflow-hidden p-6 group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-full my-4 ml-1" />
            <div className="flex justify-between items-start mb-5 pl-3">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em]">{acc.category}</span>
                <h4 className="text-lg font-black text-slate-900 mt-1">{acc.description}</h4>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-slate-900">R$ {acc.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mt-1 justify-end">
                  <Calendar size={12} />
                  <span>Vence {format(parseISO(acc.dueDate), 'dd/MM/yy')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-5 border-t border-slate-50 mt-1 pl-3">
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase bg-amber-50 text-amber-600 border border-amber-100">pendente</span>
              <div className="flex gap-2">
                <button onClick={() => handleTrash(acc.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                <button 
                  onClick={() => handlePay(acc.id)} 
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <CheckCircle size={16} /> Pagar Conta
                </button>
              </div>
            </div>
          </motion.div>
        )) : <div className="col-span-full py-12 text-center text-slate-400 italic font-medium card">Nenhuma conta pendente para o momento.</div>}
      </div>
    </div>
  );
}
