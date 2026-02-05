import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, Loader2, ArrowRightLeft, CheckSquare } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { FiscalOperation } from '../../types';

export const OperationsSettings: React.FC = () => {
    const [operations, setOperations] = useState<FiscalOperation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOp, setEditingOp] = useState<FiscalOperation | null>(null);

    useEffect(() => {
        fetchOperations();
    }, []);

    const fetchOperations = async () => {
        try {
            const { data, error } = await supabase
                .from('fiscal_operations')
                .select('*')
                .order('code', { ascending: true });

            if (error) throw error;
            setOperations(data ? data.map(d => ({
                code: d.code,
                description: d.description,
                isDevolution: d.is_devolution
            })) : []);
        } catch (error) {
            console.error('Error fetching operations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (code: string) => {
        if (!confirm('Tem certeza que deseja excluir esta Natureza de Operação?')) return;
        try {
            const { error } = await supabase.from('fiscal_operations').delete().eq('code', code);
            if (error) throw error;
            setOperations(operations.filter(op => op.code !== code));
        } catch (error) {
            console.error('Error deleting operation:', error);
            alert('Erro ao excluir. Verifique se não está em uso.');
        }
    };

    const filteredOps = operations.filter(op =>
        op.code.includes(search) || op.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar CFOP ou descrição..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button
                    onClick={() => { setEditingOp(null); setIsModalOpen(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                >
                    <Plus className="w-4 h-4" /> Nova Natureza
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest w-32">CFOP</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Descrição</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center">Devolução?</th>
                            <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center w-24">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Carregando...</td></tr>
                        ) : filteredOps.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhuma operação fiscal encontrada.</td></tr>
                        ) : (
                            filteredOps.map(op => (
                                <tr key={op.code} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 group">
                                    <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{op.code}</td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">{op.description}</td>
                                    <td className="px-6 py-4 text-center">
                                        {op.isDevolution && <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">Sim</span>}
                                    </td>
                                    <td className="px-6 py-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingOp(op); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><ArrowRightLeft className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(op.code)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <OperationModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={async () => { await fetchOperations(); setIsModalOpen(false); }}
                    initialData={editingOp}
                />
            )}
        </div>
    );
};

interface OperationModalProps {
    onClose: () => void;
    onSave: () => Promise<void>;
    initialData: FiscalOperation | null;
}

const OperationModal: React.FC<OperationModalProps> = ({ onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<FiscalOperation>(initialData || {
        code: '',
        description: '',
        isDevolution: false
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                code: formData.code,
                description: formData.description,
                is_devolution: formData.isDevolution
            };

            const { error } = await supabase
                .from('fiscal_operations')
                .upsert(payload);

            if (error) throw error;
            await onSave();
        } catch (error) {
            console.error('Error saving Operation:', error);
            alert('Erro ao salvar Natureza de Operação.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                        {initialData ? 'Editar Natureza' : 'Nova Natureza'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Trash2 className="w-5 h-5 rotate-45" /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">CFOP (Código)</label>
                        <input
                            required
                            maxLength={4}
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '') })}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ex: 5102"
                            disabled={!!initialData}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descrição da Operação</label>
                        <input
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ex: Venda de mercadoria adquirida de terceiros"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div
                            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${formData.isDevolution ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}
                            onClick={() => setFormData({ ...formData, isDevolution: !formData.isDevolution })}
                        >
                            {formData.isDevolution && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none" onClick={() => setFormData({ ...formData, isDevolution: !formData.isDevolution })}>
                            Esta é uma operação de devolução
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4"
                    >
                        {saving ? 'Salvando...' : 'Salvar Natureza'}
                    </button>
                </form>
            </div>
        </div>
    );
};
