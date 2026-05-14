import React, { useState } from 'react';
import { Plus, CreditCard as CardIcon, Trash2, Calendar, DollarSign, ArrowRight, ShoppingBag, List, ChevronDown, ChevronUp, Edit3, X } from 'lucide-react';
import { storage } from '../lib/storage';
import { CreditCard, CardPurchase } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Cards() {
  const [cards, setCards] = useState<CreditCard[]>(() => {
    const saved = storage.getCards();
    // Migração: garante que purchases exista
    return saved.map(c => ({
      ...c,
      purchases: c.purchases || []
    }));
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  
  const [newCard, setNewCard] = useState({
    name: '',
    limit: '',
    closingDay: '1',
    dueDay: '10'
  });

  const [newPurchase, setNewPurchase] = useState({
    description: '',
    amount: '',
    installments: '1',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.name || !newCard.limit) return;

    if (editingCardId) {
      const updated = cards.map(c => {
        if (c.id === editingCardId) {
          return {
            ...c,
            name: newCard.name,
            limit: parseFloat(newCard.limit),
            closingDay: parseInt(newCard.closingDay),
            dueDay: parseInt(newCard.dueDay),
          };
        }
        return c;
      });
      setCards(updated);
      storage.setCards(updated);
      setEditingCardId(null);
    } else {
      const card: CreditCard = {
        id: Date.now().toString(),
        name: newCard.name,
        limit: parseFloat(newCard.limit),
        closingDay: parseInt(newCard.closingDay),
        dueDay: parseInt(newCard.dueDay),
        currentBill: 0,
        purchases: []
      };

      const updated = [...cards, card];
      setCards(updated);
      storage.setCards(updated);
    }
    
    setShowAddForm(false);
    setNewCard({ name: '', limit: '', closingDay: '1', dueDay: '10' });
  };

  const handleEdit = (card: CreditCard) => {
    setNewCard({
      name: card.name,
      limit: card.limit.toString(),
      closingDay: card.closingDay.toString(),
      dueDay: card.dueDay.toString(),
    });
    setEditingCardId(card.id);
    setShowAddForm(true);
  };

  const handleAddPurchase = (cardId: string) => {
    if (!newPurchase.description || !newPurchase.amount) return;

    const purchase: CardPurchase = {
      id: Date.now().toString(),
      description: newPurchase.description,
      amount: parseFloat(newPurchase.amount),
      installments: parseInt(newPurchase.installments) || 1,
      date: new Date(newPurchase.date).toISOString()
    };

    const updated = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          purchases: [purchase, ...c.purchases]
        };
      }
      return c;
    });

    setCards(updated);
    storage.setCards(updated);
    setNewPurchase({
      description: '',
      amount: '',
      installments: '1',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeletePurchase = (cardId: string, purchaseId: string) => {
    if (!window.confirm('Excluir esta compra?')) return;
    const updated = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          purchases: c.purchases.filter(p => p.id !== purchaseId)
        };
      }
      return c;
    });
    setCards(updated);
    storage.setCards(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja realmente excluir este cartão? Todas as compras vinculadas a ele também serão removidas.')) {
      const updated = cards.filter(c => c.id !== id);
      setCards(updated);
      storage.setCards(updated);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 px-2 sm:px-0">
        {showAddForm && (
          <button 
            onClick={() => {
              setShowAddForm(false);
              setEditingCardId(null);
              setNewCard({ name: '', limit: '', closingDay: '1', dueDay: '10' });
            }} 
            className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm"
          >
            <X size={16} /> <span className="hidden sm:inline">Cancelar</span>
          </button>
        )}
        <button 
          onClick={() => {
            if (showAddForm && editingCardId) {
              setEditingCardId(null);
              setNewCard({ name: '', limit: '', closingDay: '1', dueDay: '10' });
            } else {
              setShowAddForm(!showAddForm);
            }
          }} 
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm min-w-[44px]"
        >
          {showAddForm && !editingCardId ? <><X size={16} /> Fechar</> : <><Plus size={16} /> <span className="hidden sm:inline">Novo Cartão</span><span className="sm:hidden">Novo</span></>}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="px-2 sm:px-0"
          >
            <form onSubmit={handleAddCard} className="card bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shadow-xl border-blue-100 p-4 sm:p-6">
              <div className="lg:col-span-4 border-b border-slate-100 pb-2 mb-2 flex justify-between items-center">
                <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">{editingCardId ? 'Editar Cartão' : 'Novo Cartão'}</h3>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-1 block">Nome do Cartão</label>
                <input type="text" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} className="input-field" placeholder="Ex: Nubank" />
              </div>
              <div>
                <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-1 block">Limite Total (R$)</label>
                <input type="number" value={newCard.limit} onChange={e => setNewCard({...newCard, limit: e.target.value})} className="input-field" placeholder="0,00" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-1 block">Fechamento</label>
                  <input type="number" min="1" max="31" value={newCard.closingDay} onChange={e => setNewCard({...newCard, closingDay: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-1 block">Vencimento</label>
                  <input type="number" min="1" max="31" value={newCard.dueDay} onChange={e => setNewCard({...newCard, dueDay: e.target.value})} className="input-field" />
                </div>
              </div>
              <div className="flex items-end mt-2 sm:mt-0">
                <button type="submit" className="btn-primary w-full py-2.5 sm:py-2 shadow-lg shadow-blue-500/10">
                  {editingCardId ? 'Salvar Alterações' : 'Cadastrar Cartão'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {cards.map((card) => {
          // Total de todas as compras (valor total, mesmo parcelado) - Isso ocupa o limite
          const totalSpentOnLimit = (card.purchases || []).reduce((acc, p) => acc + p.amount, 0);
          
          // Fatura atual (simplificado: somamos 1 parcela de cada compra parcelada + valor total de compras à vista)
          // Em um app real, verificaríamos o mês da parcela. Aqui vamos simular que "a parcela do mês" é amount/installments.
          const currentBill = (card.purchases || []).reduce((acc, p) => acc + (p.amount / (p.installments || 1)), 0);
          
          const availableLimit = card.limit - totalSpentOnLimit;
          const limitUsagePercent = (totalSpentOnLimit / card.limit) * 100;

          return (
            <motion.div layout key={card.id} className="card border-transparent bg-white p-0 overflow-hidden group shadow-soft hover:shadow-md mx-2 sm:mx-0">
              <div className="flex flex-col lg:flex-row">
                {/* Visual Card Representation */}
                <div className="lg:w-96 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  
                  <div className="flex justify-between items-start z-10">
                    <div className="bg-white/10 p-2 sm:p-3 rounded-xl text-amber-500">
                      <CardIcon size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        type="button"
                        onClick={() => handleEdit(card)} 
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                      >
                        <Edit3 size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDelete(card.id)} 
                        className="text-slate-400 hover:text-rose-400 transition-colors p-2 hover:bg-white/5 rounded-lg"
                      >
                        <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-8 sm:mt-12 z-10">
                    <h4 className="text-lg sm:text-xl font-black mb-1 truncate">{card.name}</h4>
                    <p className="text-slate-400 text-[10px] sm:text-xs font-mono tracking-widest">**** **** **** 0000</p>
                  </div>
                  
                  <div className="mt-10 sm:mt-12 space-y-3 sm:space-y-4 z-10">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500">Limite Utilizado</p>
                        <p className="text-base sm:text-lg font-black truncate">R$ {totalSpentOnLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500">Disponível</p>
                        <p className="text-xs sm:text-sm font-bold text-emerald-400 truncate">R$ {availableLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-white/10 h-1 sm:h-1.5 rounded-full overflow-hidden">
                      <div className={cn(
                        "h-full transition-all duration-500",
                        limitUsagePercent > 80 ? "bg-rose-500" : "bg-blue-500"
                      )} style={{ width: `${limitUsagePercent}%` }} />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Calendar size={12} />
                      Vence dia {card.dueDay}
                    </div>
                    <div className="text-white">
                      Fatura: R$ {currentBill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Purchases Table / Form */}
                <div className="flex-1 p-5 sm:p-8 bg-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                      <List size={18} className="text-blue-600" />
                      Lançamentos
                    </h3>
                    <button 
                      onClick={() => setExpandedCardId(expandedCardId === card.id ? null : card.id)}
                      className="text-blue-600 text-xs sm:text-sm font-bold flex items-center gap-1 hover:underline h-8"
                    >
                      {expandedCardId === card.id ? <><ChevronUp size={16} /> Fechar</> : <><ChevronDown size={16} /> Novo Lançamento</>}
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedCardId === card.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-8"
                      >
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-end">
                          <div className="flex-1 min-w-0">
                            <label className="text-[9px] uppercase font-bold text-slate-500 mb-1 block">Descrição</label>
                            <input 
                              type="text" 
                              value={newPurchase.description}
                              onChange={e => setNewPurchase({...newPurchase, description: e.target.value})}
                              className="input-field py-2 text-sm" 
                              placeholder="Ex: Amazon"
                            />
                          </div>
                          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 sm:gap-4 flex-1">
                            <div className="flex-1 sm:w-24">
                              <label className="text-[9px] uppercase font-bold text-slate-500 mb-1 block">Valor Total</label>
                              <input 
                                type="number" 
                                value={newPurchase.amount}
                                onChange={e => setNewPurchase({...newPurchase, amount: e.target.value})}
                                className="input-field py-2 text-sm" 
                                placeholder="0,00"
                              />
                            </div>
                            <div className="flex-1 sm:w-20">
                              <label className="text-[9px] uppercase font-bold text-slate-500 mb-1 block">Parcelas</label>
                              <input 
                                type="number" 
                                min="1"
                                value={newPurchase.installments}
                                onChange={e => setNewPurchase({...newPurchase, installments: e.target.value})}
                                className="input-field py-2 text-sm font-bold text-center" 
                              />
                            </div>
                          </div>
                          <div className="flex flex-row gap-3 items-end">
                            <div className="flex-1 sm:w-32 min-w-[120px]">
                              <label className="text-[9px] uppercase font-bold text-slate-500 mb-1 block">Data</label>
                              <input 
                                type="date" 
                                value={newPurchase.date}
                                onChange={e => setNewPurchase({...newPurchase, date: e.target.value})}
                                className="input-field py-2 text-sm" 
                              />
                            </div>
                            <button 
                              onClick={() => handleAddPurchase(card.id)}
                              className="bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-4 py-2.5 sm:py-2 rounded-xl hover:bg-blue-700 h-[40px] shadow-md shadow-blue-500/10 whitespace-nowrap"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-3 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2 scrollbar-hide">
                    {(card.purchases || []).length > 0 ? (card.purchases || []).map((purchase) => (
                      <div key={purchase.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors group gap-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-xl text-slate-400 shrink-0">
                            <ShoppingBag size={14} className="sm:w-4 sm:h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{purchase.description}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              {new Date(purchase.date).toLocaleDateString('pt-BR')} • {purchase.installments > 1 ? `${purchase.installments}x de R$ ${(purchase.amount / purchase.installments).toFixed(2)}` : 'À vista'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                          <p className="text-sm sm:text-base font-black text-slate-900">R$ {purchase.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <button 
                            onClick={() => handleDeletePurchase(card.id, purchase.id)}
                            className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                          >
                            <Trash2 size={16} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <p className="text-slate-400 text-xs sm:text-sm italic">Nenhuma compra registrada neste cartão.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        {cards.length === 0 && (
          <div className="col-span-full py-20 text-center card bg-slate-50 border-dashed">
            <p className="text-slate-400 italic">Nenhum cartão cadastrado. Controle suas faturas aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
}
