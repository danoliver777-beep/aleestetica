
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Cadastro realizado! Verifique seu e-mail (se confirmação for exigida) ou faça login.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="relative w-full h-[280px] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-background-dark">
        <img
          src="/logo.png"
          alt="Alessandro Estética Animal"
          className="w-48 h-48 object-contain drop-shadow-xl"
        />
      </div>

      <div className="relative z-10 -mt-10 px-6 pb-8">
        <div className="text-center mb-6">
          <h2 className="text-primary font-bold text-sm tracking-widest uppercase mb-1">Alessandro Estética Animal</h2>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">Bem-vindo<br />de volta!</h1>
        </div>

        <div className="flex p-1 mb-6 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl">
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex h-12 flex-1 items-center justify-center rounded-lg font-bold text-sm transition-all ${!isSignUp ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Entrar
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex h-12 flex-1 items-center justify-center rounded-lg font-bold text-sm transition-all ${isSignUp ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Cadastrar
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {message}
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleAuth}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">E-mail</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-gray-400 text-[20px]">mail</span>
              <input
                className="w-full h-14 pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all shadow-sm outline-none"
                placeholder="seu@email.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Senha</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-gray-400 text-[20px]">lock</span>
              <input
                className="w-full h-14 pl-12 pr-12 rounded-xl bg-white dark:bg-surface-dark border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all shadow-sm outline-none"
                placeholder="••••••••"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="absolute right-4 text-gray-400" type="button">
                <span className="material-symbols-outlined text-[20px]">visibility</span>
              </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
          >
            {loading ? (
              <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isSignUp ? 'Criar Conta' : 'Entrar'}</span>
                <span className="material-symbols-outlined text-[20px]">{isSignUp ? 'person_add' : 'arrow_forward'}</span>
              </>
            )}
          </button>
        </form>

        {!isSignUp && (
          <div className="flex justify-center pt-6">
            <button
              className="text-sm font-semibold text-secondary hover:text-orange-600 transition-colors"
              type="button"
              onClick={() => {
                // Handle Forgot Password
              }}
            >
              Esqueci minha senha
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginScreen;
