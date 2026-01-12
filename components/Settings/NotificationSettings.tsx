import React, { useState, useEffect } from 'react';
import { Save, Loader2, Check, MessageSquare } from 'lucide-react';
import { WorkshopSettings } from '../../types';
import { WorkshopContext } from '../../App';
import { fetchSettings, updateSettings } from '../../services/supabase';

const NotificationSettings: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<WorkshopSettings>({ id: 'geral' });
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Context for global update
    const context = React.useContext(WorkshopContext);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await fetchSettings();
            if (data) setSettings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const updatedSettings = { ...settings };
            await updateSettings(updatedSettings);

            if (context?.setSettings) {
                context.setSettings(updatedSettings);
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" /> WhatsApp
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Modelo de Mensagem de Orçamento</label>
                        <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                            Configure o texto padrão que será enviado ao cliente junto com o PDF do orçamento.
                            <br />
                            Use as variáveis: <code className="bg-slate-100 px-1 rounded text-indigo-600 font-bold">{`{CLIENTE}`}</code>, <code className="bg-slate-100 px-1 rounded text-indigo-600 font-bold">{`{VEICULO}`}</code>, <code className="bg-slate-100 px-1 rounded text-indigo-600 font-bold">{`{PLACA}`}</code>, <code className="bg-slate-100 px-1 rounded text-indigo-600 font-bold">{`{VALOR}`}</code>
                        </p>
                        <textarea
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-700 min-h-[150px] leading-relaxed"
                            placeholder="Olá {CLIENTE}, segue o orçamento do seu {VEICULO}..."
                            value={settings.whatsappMessageTemplate || ''}
                            onChange={e => setSettings({ ...settings, whatsappMessageTemplate: e.target.value })}
                        />
                    </div>
                </div>
            </section>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${saveSuccess
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Salvando...
                        </>
                    ) : saveSuccess ? (
                        <>
                            <Check className="w-4 h-4" />
                            Salvo com sucesso!
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Salvar Configurações
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default NotificationSettings;
