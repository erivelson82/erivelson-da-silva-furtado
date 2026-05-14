import React, { useState } from 'react';
import { Lock, User, Key, Coins } from 'lucide-react';
import { storage } from '../lib/storage';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Preencha os campos obrigatórios');
      return;
    }

    if (isRegister) {
      const users = storage.getUsers();
      if (users.some((u: any) => u.username === username)) {
        setError('Usuário já existe');
        return;
      }
      users.push({ name, username, password });
      storage.setUsers(users);
      setIsRegister(false);
      setError('');
      alert('Conta criada com sucesso! Faça login.');
    } else {
      const users = storage.getUsers();
      const user = users.find((u: any) => u.username === username && u.password === password);
      
      // Default dev credentials if no users
      if (user || (username === 'admin' && password === 'admin')) {
        storage.setSession(username);
        navigate('/');
      } else {
        setError('Usuário ou senha incorretos');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl overflow-hidden relative"
        >
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mb-16 blur-2xl" />

          <div className="text-center mb-8 relative">
            <div className="inline-flex p-3 bg-blue-600 text-white rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
              <Coins size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Finança<span className="text-blue-600">Pro</span>
            </h1>
            <p className="text-slate-500 font-medium">Controle financeiro inteligente</p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button 
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isRegister ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isRegister ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 relative">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="input-field pl-10" 
                    placeholder="João Silva"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Usuário</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field pl-10" 
                  placeholder="nome_usuario"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha</label>
              <div className="relative">
                <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-xs font-bold text-rose-500 text-center">{error}</p>}

            <button type="submit" className="w-full btn-primary py-3 rounded-xl shadow-xl shadow-blue-500/20 text-base font-bold tracking-wide mt-4">
              {isRegister ? 'Cadastrar' : 'Entrar na Conta'}
            </button>
          </form>

          {!isRegister && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Acesso Rápido</p>
              <p className="text-xs text-blue-800 font-medium mt-1">Usuário: <span className="font-bold">admin</span> | Senha: <span className="font-bold">admin</span></p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Lock size={12} />
              Seus dados são salvos localmente no navegador
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
