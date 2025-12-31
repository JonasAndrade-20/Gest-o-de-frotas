
import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Car, AlertCircle, Loader2, Info } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) onLogin(data.user.email || '');
    } catch (err: any) {
      console.error('Auth error:', err);
      let friendlyMsg = 'Ocorreu um erro inesperado.';
      
      if (err.message === 'Invalid login credentials') {
        friendlyMsg = 'Email ou senha incorretos. Verifique suas credenciais.';
      } else {
        friendlyMsg = err.message;
      }
      
      setErrorMsg(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
          <div className="p-8 sm:p-10">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4 rotate-3">
                <Car size={32} />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                FLEET<span className="text-indigo-600">AI</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Gestão inteligente de frotas
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600">
                    <User size={18} />
                  </div>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@empresa.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Senha</label>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600">
                    <Lock size={18} />
                  </div>
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Entrar na Plataforma
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-start gap-4">
              <div className="mt-1 bg-indigo-600 text-white p-1 rounded-md">
                <Info size={16} />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                Não tem conta? <br />
                <span className="text-indigo-600 dark:text-indigo-400">Entre em contato com o desenvolvedor consultoriaengbi@gmail.com para cadastro na plataforma</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
