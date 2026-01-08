
import React, { useContext, useMemo, useState } from 'react';
import { WorkshopContext } from '../../App';
import { Shield, Lock, History, KeyRound, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { updatePassword } from '../../services/supabase';

const SecuritySettings: React.FC = () => {
    const context = useContext(WorkshopContext);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Filter States
    // Filter States - Data Selection (Inputs)
    const getTodayLocal = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Filter States - Data Selection (Inputs)
    const [inputStartDate, setInputStartDate] = useState(getTodayLocal);
    const [inputEndDate, setInputEndDate] = useState(getTodayLocal);

    // Filter States - Applied (Used in filtering)
    const [auditStartDate, setAuditStartDate] = useState(getTodayLocal);
    const [auditEndDate, setAuditEndDate] = useState(getTodayLocal);

    const [auditActionFilter, setAuditActionFilter] = useState('');
    const [auditOsFilter, setAuditOsFilter] = useState('');

    if (!context) return null;
    const { history } = context;

    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [history]);

    const uniqueActions = useMemo(() => {
        const actions = new Set(history.map(h => h.action));
        return Array.from(actions).sort();
    }, [history]);

    const filteredHistory = useMemo(() => {
        return sortedHistory.filter(log => {
            const date = new Date(log.timestamp);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const logDate = `${year}-${month}-${day}`;

            const matchesDate = logDate >= auditStartDate && logDate <= auditEndDate;
            const matchesAction = auditActionFilter ? log.action === auditActionFilter : true;
            const matchesOs = auditOsFilter ? log.orderId.toString().includes(auditOsFilter) : true;
            return matchesDate && matchesAction && matchesOs;
        });
    }, [sortedHistory, auditStartDate, auditEndDate, auditActionFilter, auditOsFilter]);

    const handleApplyDateFilter = () => {
        setAuditStartDate(inputStartDate);
        setAuditEndDate(inputEndDate);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);

        if (newPassword.length < 6) {
            setPasswordError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);
        try {
            await updatePassword(newPassword);
            setPasswordSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess(false);
            }, 2000);
        } catch (err: any) {
            setPasswordError(err.message || 'Erro ao alterar senha.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Password / Access Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                        <KeyRound className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Acesso e Senhas</h3>
                        <p className="text-xs text-slate-500">Gerencie sua senha de acesso ao sistema.</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-slate-700">Senha do Administrador</p>
                        <p className="text-xs text-slate-500 mt-1">Altere sua senha de acesso ao sistema.</p>
                    </div>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all"
                    >
                        Alterar Senha
                    </button>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <Lock className="w-4 h-4 text-indigo-500" /> Alterar Senha
                            </h4>
                            <button
                                type="button"
                                onClick={() => { setShowPasswordModal(false); setPasswordError(null); setPasswordSuccess(false); }}
                                className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {passwordSuccess ? (
                            <div className="flex flex-col items-center py-8 text-emerald-600">
                                <CheckCircle className="w-12 h-12 mb-3" />
                                <p className="font-bold">Senha alterada com sucesso!</p>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Nova Senha</label>
                                    <input
                                        type="password"
                                        required
                                        autoFocus
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Confirmar Senha</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repita a nova senha"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    />
                                </div>

                                {passwordError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{passwordError}</span>
                                    </div>
                                )}

                                <div className="pt-4 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setShowPasswordModal(false); setPasswordError(null); }}
                                        className="px-4 py-2.5 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" /> {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Audit Logs */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                        <History className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Logs de Auditoria</h3>
                        <p className="text-xs text-slate-500">Histórico de ações importantes realizadas no sistema.</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">De</label>
                        <input
                            type="date"
                            value={inputStartDate}
                            onChange={(e) => setInputStartDate(e.target.value)}
                            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Até</label>
                        <input
                            type="date"
                            value={inputEndDate}
                            onChange={(e) => setInputEndDate(e.target.value)}
                            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 opacity-0 text-[10px]">Filtrar</label>
                        <button
                            onClick={handleApplyDateFilter}
                            className="h-[34px] px-4 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        >
                            Aplicar
                        </button>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Filtrar Ação</label>
                        <select
                            value={auditActionFilter}
                            onChange={(e) => setAuditActionFilter(e.target.value)}
                            className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500"
                        >
                            <option value="">Todas as Ações</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Filtrar OS</label>
                        <input
                            type="text"
                            placeholder="Nº OS"
                            value={auditOsFilter}
                            onChange={(e) => setAuditOsFilter(e.target.value)}
                            className="w-24 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg p-2 outline-none focus:border-indigo-500 placeholder:font-normal"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider w-24">OS</th>
                                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Data/Hora</th>
                                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Ação</th>
                                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Detalhes</th>
                                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredHistory.length > 0 ? filteredHistory.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-indigo-600 font-black text-xs">
                                        #{log.orderId}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-slate-800">
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wide ${log.action.includes('Delete') || log.action.includes('Excluir') ? 'bg-red-50 text-red-600' :
                                            log.action.includes('Create') || log.action.includes('Criar') ? 'bg-emerald-50 text-emerald-600' :
                                                'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={log.diff || ''}>
                                        {log.diff || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 font-medium">
                                        {log.userId || 'Sistema'}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                                        Nenhum registro encontrado no período selecionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
