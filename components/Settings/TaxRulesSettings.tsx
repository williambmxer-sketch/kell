import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, Loader2, Edit3, Layers } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { FiscalTaxRule, FiscalOperation } from '../../types';

export const TaxRulesSettings: React.FC = () => {
    const [rules, setRules] = useState<FiscalTaxRule[]>([]);
    const [operations, setOperations] = useState<FiscalOperation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<FiscalTaxRule | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [rulesRes, opsRes] = await Promise.all([
                supabase.from('fiscal_tax_rules').select('*').order('name'),
                supabase.from('fiscal_operations').select('*').order('code')
            ]);

            if (rulesRes.error) throw rulesRes.error;
            if (opsRes.error) throw opsRes.error;

            setRules(rulesRes.data ? rulesRes.data.map(d => ({
                id: d.id,
                name: d.name,
                description: d.description,
                cfopState: d.cfop_state,
                cfopInterstate: d.cfop_interstate,
                csosn: d.csosn,
                cstIcms: d.cst_icms,
                icmsRate: d.icms_rate,
                cstIpi: d.cst_ipi,
                ipiRate: d.ipi_rate,
                cstPisCofins: d.cst_pis_cofins,
                pisRate: d.pis_rate,
                cofinsRate: d.cofins_rate,
                cstIbs: d.cst_ibs,
                ibsRate: d.ibs_rate,
                cstCbs: d.cst_cbs,
                cbsRate: d.cbs_rate
            })) : []);

            setOperations(opsRes.data ? opsRes.data.map(d => ({ code: d.code, description: d.description, isDevolution: d.is_devolution })) : []);
        } catch (error) {
            console.error('Error fetching tax rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta Regra Fiscal?')) return;
        try {
            const { error } = await supabase.from('fiscal_tax_rules').delete().eq('id', id);
            if (error) throw error;
            setRules(rules.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting rule:', error);
            alert('Erro ao excluir regra.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
                <button
                    onClick={() => { setEditingRule(null); setIsModalOpen(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                >
                    <Plus className="w-4 h-4" /> Nova Regra
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-3 p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
                ) : rules.length === 0 ? (
                    <div className="col-span-3 text-center text-slate-400 p-8">Nenhuma regra cadastrada.</div>
                ) : (
                    rules.map(rule => (
                        <div key={rule.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group relative">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{rule.name}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{rule.description || 'Sem descrição'}</p>
                                </div>
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <Layers className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <div className="flex justify-between"><span>CFOP (Est):</span> <span className="font-bold">{rule.cfopState || '-'}</span></div>
                                <div className="flex justify-between"><span>CSOSN:</span> <span className="font-bold">{rule.csosn || '-'}</span></div>
                                <div className="flex justify-between"><span>PIS/COFINS:</span> <span className="font-bold">{rule.cstPisCofins || '-'}</span></div>
                                <div className="flex justify-between"><span>IBS/CBS:</span> <span className="font-bold text-amber-600">{(rule.ibsRate || 0) + (rule.cbsRate || 0)}%</span></div>
                            </div>

                            <div className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button onClick={() => { setEditingRule(rule); setIsModalOpen(true); }} className="p-1.5 bg-white dark:bg-slate-700 text-slate-400 hover:text-indigo-600 shadow-sm rounded-lg border border-slate-100 dark:border-slate-600"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDelete(rule.id)} className="p-1.5 bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 shadow-sm rounded-lg border border-slate-100 dark:border-slate-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <RuleModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={async () => { await fetchData(); setIsModalOpen(false); }}
                    initialData={editingRule}
                    operations={operations}
                />
            )}
        </div>
    );
};

interface RuleModalProps {
    onClose: () => void;
    onSave: () => Promise<void>;
    initialData: FiscalTaxRule | null;
    operations: FiscalOperation[];
}

const RuleModal: React.FC<RuleModalProps> = ({ onClose, onSave, initialData, operations }) => {
    const [formData, setFormData] = useState<FiscalTaxRule>(initialData || {
        id: '',
        name: '',
        description: '',
        cfopState: '',
        cfopInterstate: '',
        csosn: '102',
        cstPisCofins: '01',
        pisRate: 0,
        cofinsRate: 0,
        icmsRate: 0,
        cstIbs: '',
        ibsRate: 0,
        cstCbs: '',
        cbsRate: 0
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                cfop_state: formData.cfopState || null,
                cfop_interstate: formData.cfopInterstate || null,
                csosn: formData.csosn,
                cst_pis_cofins: formData.cstPisCofins,
                pis_rate: formData.pisRate,
                cofins_rate: formData.cofinsRate,
                icms_rate: formData.icmsRate,
                cst_ibs: formData.cstIbs,
                ibs_rate: formData.ibsRate,
                cst_cbs: formData.cstCbs,
                cbs_rate: formData.cbsRate
            };

            const { error } = await supabase
                .from('fiscal_tax_rules')
                .upsert(initialData?.id ? { id: initialData.id, ...payload } : payload);

            if (error) throw error;
            await onSave();
        } catch (error) {
            console.error('Error saving rule:', error);
            alert('Erro ao salvar regra: ' + (error instanceof Error ? error.message : JSON.stringify(error)));
        } finally {
            setSaving(false);
        }
    };

    const inputClasses = "w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500";
    const labelClasses = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                        {initialData ? 'Editar Regra Fiscal' : 'Nova Regra Fiscal'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Trash2 className="w-5 h-5 rotate-45" /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={labelClasses}>Nome da Regra (Ex: Revenda Dentro do Estado)</label>
                            <input required className={inputClasses} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Identificação da regra" />
                        </div>
                        <div className="col-span-2">
                            <label className={labelClasses}>Descrição</label>
                            <input className={inputClasses} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Detalhes opcionais..." />
                        </div>

                        <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 my-2"></div>

                        <div>
                            <label className={labelClasses}>CFOP (Estadual)</label>
                            <select required className={inputClasses} value={formData.cfopState || ''} onChange={e => setFormData({ ...formData, cfopState: e.target.value })}>
                                <option value="">Selecione...</option>
                                {operations.map(op => <option key={op.code} value={op.code}>{op.code} - {op.description}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>CFOP (Interestadual)</label>
                            <select className={inputClasses} value={formData.cfopInterstate || ''} onChange={e => setFormData({ ...formData, cfopInterstate: e.target.value })}>
                                <option value="">Selecione...</option>
                                {operations.map(op => <option key={op.code} value={op.code}>{op.code} - {op.description}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>CSOSN (Simples)</label>
                            <select className={inputClasses} value={formData.csosn || ''} onChange={e => setFormData({ ...formData, csosn: e.target.value })}>
                                <option value="101">101 - Tributada c/ perm. crédito</option>
                                <option value="102">102 - Tributada s/ perm. crédito</option>
                                <option value="103">103 - Isenção do ICMS</option>
                                <option value="300">300 - Imune</option>
                                <option value="400">400 - Não tributada</option>
                                <option value="500">500 - ICMS cobrado ant. por ST</option>
                                <option value="900">900 - Outros</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>CST PIS/COFINS</label>
                            <select className={inputClasses} value={formData.cstPisCofins || ''} onChange={e => setFormData({ ...formData, cstPisCofins: e.target.value })}>
                                <option value="01">01 - Operação Tributável (Aliq. Básica)</option>
                                <option value="04">04 - Operação Tributável (Monofásica/Aliq. Zero)</option>
                                <option value="06">06 - Operação Tributável (Aliq. Zero)</option>
                                <option value="07">07 - Operação Isenta da Contribuição</option>
                                <option value="08">08 - Operação sem Incidência da Contribuição</option>
                                <option value="49">49 - Outras Operações de Saída</option>
                                <option value="99">99 - Outras Operações</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClasses}>Alíquota ICMS (%)</label>
                            <input type="number" step="0.01" className={inputClasses} value={formData.icmsRate || 0} onChange={e => setFormData({ ...formData, icmsRate: Number(e.target.value) })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className={labelClasses}>Aliq. PIS (%)</label>
                                <input type="number" step="0.01" className={inputClasses} value={formData.pisRate || 0} onChange={e => setFormData({ ...formData, pisRate: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className={labelClasses}>Aliq. COFINS (%)</label>
                                <input type="number" step="0.01" className={inputClasses} value={formData.cofinsRate || 0} onChange={e => setFormData({ ...formData, cofinsRate: Number(e.target.value) })} />
                            </div>
                        </div>

                        <div className="col-span-2 border-t border-slate-100 dark:border-slate-700 my-2"></div>
                        <h4 className="col-span-2 text-xs font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                            Reforma Tributária (2026+)
                        </h4>

                        <div className="grid grid-cols-2 gap-4 col-span-2">
                            <div>
                                <label className={labelClasses}>CST IBS</label>
                                <input className={inputClasses} value={formData.cstIbs || ''} onChange={e => setFormData({ ...formData, cstIbs: e.target.value })} placeholder="Ex: 01" />
                            </div>
                            <div>
                                <label className={labelClasses}>Aliq. IBS (%)</label>
                                <input type="number" step="0.01" className={inputClasses} value={formData.ibsRate || 0} onChange={e => setFormData({ ...formData, ibsRate: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className={labelClasses}>CST CBS</label>
                                <input className={inputClasses} value={formData.cstCbs || ''} onChange={e => setFormData({ ...formData, cstCbs: e.target.value })} placeholder="Ex: 01" />
                            </div>
                            <div>
                                <label className={labelClasses}>Aliq. CBS (%)</label>
                                <input type="number" step="0.01" className={inputClasses} value={formData.cbsRate || 0} onChange={e => setFormData({ ...formData, cbsRate: Number(e.target.value) })} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4"
                    >
                        {saving ? 'Salvando...' : 'Salvar Regra'}
                    </button>
                </form>
            </div>
        </div>
    );
};
