
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, Building, Clock, MapPin, Phone, Mail, FileText, Check, Loader2 } from 'lucide-react';
import { WorkshopSettings } from '../../types';
import { WorkshopContext } from '../../App';
import { fetchSettings, updateSettings, uploadLogo } from '../../services/supabase';

const DAYS = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
];

const GeneralSettings: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [settings, setSettings] = useState<WorkshopSettings>({
        id: 'geral',
        horario_funcionamento: DAYS.reduce((acc, day) => ({
            ...acc, [day.key]: { ativo: true, inicio: '08:00', fim: '18:00' }
        }), {})
    });

    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await fetchSettings();
            if (data) {
                // Ensure default structure for hours if missing
                const defaultHours = DAYS.reduce((acc, day) => ({
                    ...acc, [day.key]: { ativo: true, inicio: '08:00', fim: '18:00' }
                }), {});

                setSettings({
                    ...data,
                    horario_funcionamento: { ...defaultHours, ...(data.horario_funcionamento || {}) }
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCepBlur = async () => {
        const cep = settings.cep?.replace(/\D/g, '');
        if (cep?.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setSettings(prev => ({
                        ...prev,
                        endereco: data.logradouro,
                        bairro: data.bairro,
                        cidade: data.localidade,
                        estado: data.uf
                    }));
                }
            } catch (error) {
                console.error("CEP error", error);
            }
        }
    };



    // Update global context when settings change locally (after save)
    const context = React.useContext(WorkshopContext);

    // Modification: Sync with global context on save
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            let logoUrl = settings.logo_url;

            if (logoFile) {
                const { url, error } = await uploadLogo(logoFile);
                if (url) {
                    logoUrl = url;
                } else {
                    alert(`Erro ao fazer upload: ${error || 'Erro desconhecido'}`);
                    setIsSaving(false);
                    return;
                }
            }

            const updatedSettings = { ...settings, logo_url: logoUrl };
            await updateSettings(updatedSettings);
            setSettings(updatedSettings);

            // Update global context to reflect changes in Sidebar immediately
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

    const inputClass = "w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-700";
    const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block";

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            {/* Branding */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-500" /> Identidade Visual
                </h3>
                <div className="flex items-center gap-6">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all overflow-hidden relative group"
                    >
                        {(previewUrl || settings.logo_url) ? (
                            <img src={previewUrl || settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-900">Logo da Oficina</h4>
                        <p className="text-xs text-slate-500 mt-1">Recomendado: 512x512px (PNG ou JPG).</p>
                        <p className="text-xs text-slate-500">Clique para alterar.</p>
                    </div>
                </div>
            </section>

            {/* Basic Info */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> Dados Cadastrais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Nome da Oficina</label><input required className={inputClass} value={settings.nome_oficina || ''} onChange={e => setSettings({ ...settings, nome_oficina: e.target.value })} /></div>
                    <div><label className={labelClass}>CNPJ</label><input className={inputClass} value={settings.cnpj || ''} onChange={e => setSettings({ ...settings, cnpj: e.target.value })} /></div>
                    <div><label className={labelClass}>Telefone / WhatsApp</label><input className={inputClass} value={settings.telefone || ''} onChange={e => setSettings({ ...settings, telefone: e.target.value })} /></div>
                    <div><label className={labelClass}>Email de Contato</label><input className={inputClass} value={settings.email || ''} onChange={e => setSettings({ ...settings, email: e.target.value })} /></div>
                </div>
            </section>

            {/* Address */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" /> Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div><label className={labelClass}>CEP</label><input className={inputClass} value={settings.cep || ''} onChange={e => setSettings({ ...settings, cep: e.target.value })} onBlur={handleCepBlur} placeholder="00000-000" /></div>
                    <div className="md:col-span-3"><label className={labelClass}>Endereço</label><input className={inputClass} value={settings.endereco || ''} onChange={e => setSettings({ ...settings, endereco: e.target.value })} /></div>
                    <div><label className={labelClass}>Número</label><input className={inputClass} value={settings.numero || ''} onChange={e => setSettings({ ...settings, numero: e.target.value })} /></div>
                    <div><label className={labelClass}>Bairro</label><input className={inputClass} value={settings.bairro || ''} onChange={e => setSettings({ ...settings, bairro: e.target.value })} /></div>
                    <div><label className={labelClass}>Cidade</label><input className={inputClass} value={settings.cidade || ''} onChange={e => setSettings({ ...settings, cidade: e.target.value })} /></div>
                    <div><label className={labelClass}>Estado</label><input className={inputClass} value={settings.estado || ''} onChange={e => setSettings({ ...settings, estado: e.target.value })} maxLength={2} /></div>
                </div>
            </section>

            {/* Business Hours */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" /> Horário de Funcionamento
                </h3>
                <div className="space-y-3">
                    {DAYS.map(day => {
                        const dayConfig = settings.horario_funcionamento?.[day.key] || { ativo: false, inicio: '', fim: '' };
                        return (
                            <div key={day.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-6 rounded-full flex items-center transition-colors p-1 cursor-pointer ${dayConfig.ativo ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'}`}
                                        onClick={() => setSettings(prev => ({
                                            ...prev,
                                            horario_funcionamento: {
                                                ...prev.horario_funcionamento,
                                                [day.key]: { ...dayConfig, ativo: !dayConfig.ativo }
                                            }
                                        }))}
                                    >
                                        <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 uppercase w-24">{day.label}</span>
                                </div>

                                {dayConfig.ativo ? (
                                    <div className="flex items-center gap-2">
                                        <input type="time" className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-500"
                                            value={dayConfig.inicio}
                                            onChange={e => setSettings(prev => ({
                                                ...prev, horario_funcionamento: { ...prev.horario_funcionamento, [day.key]: { ...dayConfig, inicio: e.target.value } }
                                            }))}
                                        />
                                        <span className="text-slate-400 text-xs">até</span>
                                        <input type="time" className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-500"
                                            value={dayConfig.fim}
                                            onChange={e => setSettings(prev => ({
                                                ...prev, horario_funcionamento: { ...prev.horario_funcionamento, [day.key]: { ...dayConfig, fim: e.target.value } }
                                            }))}
                                        />
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400 italic">Fechado</span>
                                )}
                            </div>
                        );
                    })}
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

export default GeneralSettings;
