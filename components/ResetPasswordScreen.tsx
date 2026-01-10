
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface ResetPasswordScreenProps {
    onBack: () => void;
    onSuccess: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onBack, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });
            if (error) throw error;
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar senha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 px-6 py-8">
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-gray-400 hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-2">Nova Senha</h1>
                <p className="text-gray-500 dark:text-gray-400">Escolha uma nova senha forte para sua conta.</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {error}
                </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={handleResetPassword}>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Nova Senha</label>
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-gray-400 text-[20px]">lock</span>
                        <input
                            className="w-full h-14 pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all shadow-sm outline-none"
                            placeholder="••••••••"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Confirmar Senha</label>
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-gray-400 text-[20px]">lock_reset</span>
                        <input
                            className="w-full h-14 pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white placeholder:text-gray-400 font-medium transition-all shadow-sm outline-none"
                            placeholder="••••••••"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    disabled={loading}
                    className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                    type="submit"
                >
                    {loading ? (
                        <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                        <>
                            <span>Redefinir Senha</span>
                            <span className="material-symbols-outlined text-[20px]">check</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ResetPasswordScreen;
