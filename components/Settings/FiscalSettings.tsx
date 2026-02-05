import React, { useState, useEffect } from 'react';
import { Save, Loader2, Upload, FileText, CheckCircle, Tag } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { FiscalSettings as FiscalSettingsType } from '../../types';
import { NcmSettings } from './NcmSettings';
import { OperationsSettings } from './OperationsSettings';
import { TaxRulesSettings } from './TaxRulesSettings';

export const FiscalSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'ncm' | 'operations' | 'rules'>('general');
    const [settings, setSettings] = useState<FiscalSettingsType>({
        id: '',
        companyTaxRegime: 'SIMPLES_NACIONAL',
        stateRegistration: '',
        defaultPisCofinsCst: ''
    });

    useEffect(() => {
        fetchFiscalSettings();
    }, []);

    const fetchFiscalSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('fiscal_settings')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

            if (data) {
                setSettings({
                    id: data.id,
                    companyTaxRegime: data.company_tax_regime,
                    stateRegistration: data.state_registration,
                    defaultPisCofinsCst: data.default_pis_cofins_cst
                });
            }
        } catch (error) {
            console.error('Error fetching fiscal settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                company_tax_regime: settings.companyTaxRegime,
                state_registration: settings.stateRegistration,
                default_pis_cofins_cst: settings.defaultPisCofinsCst
            };

            const { error } = await supabase
                .from('fiscal_settings')
                .upsert(settings.id ? { id: settings.id, ...payload } : payload);

            if (error) throw error;
            await fetchFiscalSettings(); // Refresh ID if new
        } catch (error) {
            console.error('Error saving fiscal settings:', error);
            alert('Erro ao salvar configurações fiscais.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    Dados da Empresa
                </button>
                <button
                    onClick={() => setActiveTab('ncm')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'ncm' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    NCMs
                </button>
                <button
                    onClick={() => setActiveTab('operations')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'operations' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    Naturezas (CFOP)
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'rules' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    Regras de Imposto
                </button>
            </div>

            {activeTab === 'general' && (
                <form onSubmit={handleSave} className="space-y-6 max-w-3xl animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Dados Cadastrais
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Regime Tributário</label>
                                <select
                                    value={settings.companyTaxRegime}
                                    onChange={e => setSettings({ ...settings, companyTaxRegime: e.target.value as any })}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                                    <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                                    <option value="LUCRO_REAL">Lucro Real</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Inscrição Estadual</label>
                                <input
                                    type="text"
                                    value={settings.stateRegistration || ''}
                                    onChange={e => setSettings({ ...settings, stateRegistration: e.target.value })}
                                    placeholder="Ex: 123.456.789.123"
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm opacity-50 pointer-events-none relative">
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="bg-slate-900 text-white px-3 py-1 text-xs font-bold rounded-full uppercase tracking-widest opacity-80">Em Breve</span>
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Certificado Digital (A1)
                        </h3>
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center flex flex-col items-center gap-2">
                            <p className="text-sm text-slate-400 font-medium">Arraste seu arquivo .PFX ou .P12 aqui</p>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Configurações
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'ncm' && (
                <div className="animate-fade-in">
                    <NcmSettings />
                </div>
            )}

            {activeTab === 'operations' && (
                <div className="animate-fade-in">
                    <OperationsSettings />
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="animate-fade-in">
                    <TaxRulesSettings />
                </div>
            )}
        </div>
    );
};
