import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Globe, Layout, Monitor, Shield, Save } from 'lucide-react';

const SystemSettings: React.FC = () => {
    const { sidebarMode, setSidebarMode } = useTheme();
    const [activeTab, setActiveTab] = useState('global');

    const tabs = [
        { id: 'global', label: 'Global', icon: Globe },
        // Future tabs can be added here
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Tabs Header */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                            : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {activeTab === 'global' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sidebar Configuration */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Layout className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Comportamento da Barra Lateral</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Defina como o menu lateral deve se comportar durante a navegação.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${sidebarMode === 'automatic'
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/20'
                                : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                                }`}>
                                <input
                                    type="radio"
                                    name="sidebarMode"
                                    value="automatic"
                                    checked={sidebarMode === 'automatic'}
                                    onChange={() => setSidebarMode('automatic')}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <div>
                                    <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">Automática (Hover)</span>
                                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Recolhida por padrão, expande ao passar o mouse.</span>
                                </div>
                            </label>

                            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${sidebarMode === 'fixed-open'
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/20'
                                : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                                }`}>
                                <input
                                    type="radio"
                                    name="sidebarMode"
                                    value="fixed-open"
                                    checked={sidebarMode === 'fixed-open'}
                                    onChange={() => setSidebarMode('fixed-open')}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <div>
                                    <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">Fixa Aberta</span>
                                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sempre expandida, ocupando mais espaço.</span>
                                </div>
                            </label>

                            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${sidebarMode === 'fixed-closed'
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/20'
                                : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                                }`}>
                                <input
                                    type="radio"
                                    name="sidebarMode"
                                    value="fixed-closed"
                                    checked={sidebarMode === 'fixed-closed'}
                                    onChange={() => setSidebarMode('fixed-closed')}
                                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <div>
                                    <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">Fixa Fechada</span>
                                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sempre recolhida, não expande com mouse (foco em espaço).</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
