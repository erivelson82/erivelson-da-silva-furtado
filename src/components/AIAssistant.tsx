import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import { storage } from '../lib/storage';
import { cn } from '../lib/utils';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Olá! Sou o FinançaPro AI. Como posso te ajudar com suas finanças hoje?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setChat(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const context = {
      transactions: storage.getTransactions(),
      pending: storage.getPending(),
      budgets: storage.getBudgets(),
      cards: storage.getCards(),
    };

    const response = await geminiService.getAssistantResponse(userMessage, context);
    
    setChat(prev => [...prev, { role: 'ai', content: response || 'Não consegui processar sua solicitação.' }]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-5 z-40 bg-blue-600 text-white p-4 rounded-2xl shadow-2xl shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all group"
      >
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[70vh]"
            >
              {/* Header */}
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 className="font-black tracking-tight">Assistente FinançaPro</h3>
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Online agora
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Chat Body */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                {chat.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className={cn(
                      "max-w-[85%] rounded-2xl p-4 text-sm font-medium leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-blue-600 text-white ml-auto rounded-tr-none shadow-md" 
                        : "bg-white text-slate-700 mr-auto rounded-tl-none shadow-sm border border-slate-100"
                    )}
                  >
                    {msg.content}
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="bg-white text-slate-400 mr-auto rounded-2xl rounded-tl-none p-4 text-sm font-medium shadow-sm border border-slate-100 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Analisando seus dados...
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Pergunte sobre seus gastos..."
                  className="flex-1 bg-slate-100 border-none rounded-xl px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !message.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
