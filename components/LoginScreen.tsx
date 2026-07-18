import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState<'dog' | 'cat' | 'other'>('dog');
  const [petBreed, setPetBreed] = useState('');
  const [phone, setPhone] = useState('');
  const [regStep, setRegStep] = useState<'AUTH' | 'ADDRESS' | 'PET'>('AUTH');
  const [showPassword, setShowPassword] = useState(false);
  const { user, profile, pets, registrationComplete, role, refreshAuthData } = useAuth();

  // Effect to sync step if already logged in but incomplete
  useEffect(() => {
    if (user && role === UserRole.CLIENT && !registrationComplete) {
      setIsSignUp(true);
      if (!profile?.address || !profile?.phone) {
        setRegStep('ADDRESS');
      } else if (pets.length === 0) {
        setRegStep('PET');
      }
    }
  }, [user, role, registrationComplete, profile, pets]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        if (regStep === 'AUTH') {
          const { data: authData, error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) throw error;

          if (authData.user) {
            await supabase.from('profiles').upsert({
              id: authData.user.id,
              nickname: nickname || email.split('@')[0],
              full_name: nickname || email.split('@')[0],
            });
            await refreshAuthData();
            setRegStep('ADDRESS');
          }
        } else if (regStep === 'ADDRESS') {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Usuário não encontrado');

          const { error } = await supabase.from('profiles').update({
            address,
            neighborhood,
            phone
          }).eq('id', user.id);

          if (error) throw error;
          await refreshAuthData();
          setRegStep('PET');
        } else if (regStep === 'PET') {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Usuário não encontrado');

          if (!petName.trim()) throw new Error('Por favor, informe o nome do pet');

          const { error: petError } = await supabase.from('pets').insert({
            user_id: user.id,
            name: petName.trim(),
            type: petType,
            breed: petBreed.trim() || null
          });

          if (petError) throw petError;
          await refreshAuthData();

          setMessage('Cadastro completo! Bem-vindo(a).');
          // No reload needed, App.tsx will react to registrationComplete change
        }
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

        {isSignUp && (
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className={`size-3 rounded-full ${regStep === 'AUTH' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <div className={`h-px w-6 ${regStep !== 'AUTH' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <div className={`size-3 rounded-full ${regStep === 'ADDRESS' ? 'bg-primary' : regStep === 'PET' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <div className={`h-px w-6 ${regStep === 'PET' ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <div className={`size-3 rounded-full ${regStep === 'PET' ? 'bg-primary' : 'bg-gray-300'}`}></div>
            </div>
          </div>
        )}

        <div className="flex p-1 mb-6 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl">
          <button
            onClick={() => { setIsSignUp(false); setRegStep('AUTH'); }}
            className={`flex h-12 flex-1 items-center justify-center rounded-lg font-bold text-sm transition-all ${!isSignUp ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setIsSignUp(true); setRegStep('AUTH'); }}
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
          {(!isSignUp || regStep === 'AUTH') && (
            <>
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-4 text-gray-400 hover:text-primary transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Nome Completo / Como quer ser chamado?</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-gray-400 text-[20px]">person</span>
                    <input
                      className="w-full h-14 pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all shadow-sm outline-none"
                      placeholder="Ex: João Silva"
                      required={isSignUp}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {isSignUp && regStep === 'ADDRESS' && (
            <>
              <div className="text-center mb-2">
                <h3 className="font-bold text-lg">Onde você mora?</h3>
                <p className="text-sm text-gray-500">Precisamos do seu endereço para o cadastro.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Endereço (Rua e Número)</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-gray-400 text-[20px]">home</span>
                  <input
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all shadow-sm outline-none"
                    placeholder="Ex: Rua das Flores, 123"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Bairro</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-gray-400 text-[20px]">location_on</span>
                  <input
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all shadow-sm outline-none"
                    placeholder="Ex: Centro"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">WhatsApp / Telefone</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-gray-400 text-[20px]">phone</span>
                  <input
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all shadow-sm outline-none"
                    placeholder="Ex: (11) 98765-4321"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {isSignUp && regStep === 'PET' && (
            <>
              <div className="text-center mb-2">
                <h3 className="font-bold text-lg">Agora o seu Pet!</h3>
                <p className="text-sm text-gray-500">Cadastre seu primeiro pet para continuar.</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Nome do Pet</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-gray-400 text-[20px]">pets</span>
                  <input
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all shadow-sm outline-none"
                    placeholder="Ex: Thor"
                    required
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPetType('dog')}
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl border-2 transition-all ${petType === 'dog' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-400'}`}
                >
                  <span className="material-symbols-outlined">sound_detection_dog_barking</span>
                  <span className="font-bold text-sm">Cachorro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPetType('cat')}
                  className={`flex h-12 items-center justify-center gap-2 rounded-xl border-2 transition-all ${petType === 'cat' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-400'}`}
                >
                  <span className="material-symbols-outlined">pets</span>
                  <span className="font-bold text-sm">Gato</span>
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Raça (Opcional)</label>
                <input
                  className="w-full h-14 px-4 rounded-xl bg-white dark:bg-surface-dark border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all shadow-sm outline-none"
                  placeholder="Ex: Golden Retriever"
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                />
              </div>
            </>
          )}

          <button
            disabled={loading}
            className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
          >
            {loading ? (
              <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>
                  {!isSignUp ? 'Entrar' :
                    regStep === 'AUTH' ? 'Continuar para Endereço' :
                      regStep === 'ADDRESS' ? 'Continuar para Pet' : 'Finalizar Cadastro'}
                </span>
                <span className="material-symbols-outlined text-[20px]">
                  {!isSignUp ? 'arrow_forward' : regStep === 'PET' ? 'done_all' : 'arrow_forward'}
                </span>
              </>
            )}
          </button>
        </form>

        {!isSignUp && (
          <div className="flex justify-center pt-6">
            <button
              className="text-sm font-semibold text-secondary hover:text-orange-600 transition-colors disabled:opacity-50"
              type="button"
              disabled={loading}
              onClick={async () => {
                if (!email) {
                  setError('Por favor, insira seu e-mail para recuperar a senha.');
                  return;
                }
                setLoading(true);
                setError(null);
                setMessage(null);
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                  });
                  if (error) throw error;
                  setMessage('Link de recuperação enviado para o seu e-mail!');
                } catch (err: any) {
                  setError(err.message || 'Erro ao enviar e-mail de recuperação');
                } finally {
                  setLoading(false);
                }
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
