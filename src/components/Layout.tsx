import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Clock, 
  PieChart, 
  CreditCard, 
  LineChart, 
  FileText, 
  Upload, 
  LogOut,
  Coins,
  MoreHorizontal,
  X
} from 'lucide-react';
import { storage } from '../lib/storage';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import AIAssistant from './AIAssistant';

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/investments', icon: LineChart, label: 'Investir' },
  { to: '/reports', icon: FileText, label: 'Relatórios' },
];

const secondaryNav = [
  { to: '/pending', icon: Clock, label: 'Pendentes' },
  { to: '/budget', icon: PieChart, label: 'Orçamento' },
  { to: '/cards', icon: CreditCard, label: 'Cartões' },
  { to: '/import', icon: Upload, label: 'Importar' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const username = storage.getSession();
  const [showMore, setShowMore] = useState(false);

  const handleLogout = () => {
    storage.setSession(null);
    navigate('/login');
  };

  if (!username && window.location.pathname !== '/login') {
    return <>{children}</>;
  }

  const allItems = [...mainNav, ...secondaryNav];
  const activeItem = allItems.find(item => item.to === window.location.pathname) || mainNav[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg sm:rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Coins size={18} className="sm:w-5 sm:h-5" />
          </div>
          <h1 className="text-base sm:text-lg font-black tracking-tight">
            Finança<span className="text-blue-600 font-extrabold">Pro</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 bg-slate-50/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-slate-100/50">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-[9px] sm:text-[10px]">
              {username?.charAt(0).toUpperCase()}
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-700 hidden sm:inline">{username}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            title="Sair"
          >
            <LogOut size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Page Title Extra Header */}
      <div className="px-4 pt-4 sm:pt-8 pb-1 sm:pb-2 max-w-7xl mx-auto w-full">
         <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
          {activeItem.label}
        </h2>
        <p className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-28 sm:pb-32 max-w-7xl mx-auto w-full">
        {children}
        <AIAssistant />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-2 pt-1 pb-safe shadow-[0_-1px_20px_rgba(0,0,0,0.03)] rounded-t-[32px] sm:rounded-none">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-0.5">
          {mainNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setShowMore(false)}
              className={({ isActive }) =>
                cn(
                  "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-500 relative group",
                  isActive 
                    ? "text-blue-600" 
                    : "text-slate-400 hover:text-slate-600"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={cn(
                    "transition-all duration-500",
                    isActive ? "scale-110 stroke-[2.5px] -translate-y-0.5" : "group-hover:scale-105"
                  )} />
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest transition-all duration-500",
                    isActive ? "opacity-100" : "opacity-0 invisible sm:visible sm:opacity-40"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-pill"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      className="absolute -top-1 left-4 right-4 h-1 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
          
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-500 relative group",
              showMore ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <MoreHorizontal size={20} className={cn(
              "transition-all duration-500",
              showMore ? "scale-110 stroke-[2.5px] rotate-90 -translate-y-0.5" : "group-hover:scale-105"
            )} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest transition-all duration-500",
              showMore ? "opacity-100" : "opacity-0 invisible sm:visible sm:opacity-40"
            )}>
              Mais
            </span>
          </button>
        </div>
      </nav>

      {/* More Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <div className="fixed inset-0 z-40 flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-strong overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900">Outros Recursos</h3>
                <button onClick={() => setShowMore(false)} className="p-2 bg-slate-100 text-slate-400 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {secondaryNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMore(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex flex-col items-center gap-3 p-5 rounded-3xl transition-all border",
                        isActive 
                          ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm shadow-blue-500/5" 
                          : "bg-white border-slate-100/10 hover:border-slate-200 text-slate-600 shadow-sm"
                      )
                    }
                  >
                    <div className={cn(
                      "p-3 rounded-2xl",
                      window.location.pathname === item.to ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"
                    )}>
                      <item.icon size={24} />
                    </div>
                    <span className="text-xs font-bold">{item.label}</span>
                  </NavLink>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 py-4 text-sm text-rose-500 font-bold hover:bg-rose-50 rounded-2xl transition-all"
                >
                  <LogOut size={18} />
                  Sair da Conta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
