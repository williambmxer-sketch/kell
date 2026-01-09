
import React, { useState, useEffect } from 'react';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { signIn, fetchSettings } from '../services/supabase';
import { WorkshopSettings } from '../types';

interface LoginProps {
    onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState<WorkshopSettings | null>(null);

    // Fetch settings for branding
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await fetchSettings();
                setSettings(data);
            } catch (err) {
                console.error('Failed to load settings for login:', err);
            }
        };
        loadSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await signIn(email, password);
            onSuccess();
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    const companyName = settings?.nome_oficina || 'Oficina Master Pro';
    const logoUrl = settings?.logo_url;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={companyName}
                            className="w-20 h-20 object-contain mx-auto mb-4 rounded-2xl bg-white/10 p-2"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                    )}
                    <h1 className="text-2xl font-black text-white tracking-tight">{companyName}</h1>
                    <p className="text-indigo-300 text-sm mt-1">Faça login para acessar o sistema</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@exemplo.com"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar no Sistema'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-3 mt-8">
                    <img src="/WOLVES_SEM_FUNDO.png" alt="Wolves Tecnologia" className="w-24 h-auto object-contain" />
                    <span className="text-white text-xs font-bold tracking-widest uppercase text-opacity-80">WOLVES tecnologia</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
