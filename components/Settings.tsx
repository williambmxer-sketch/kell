
import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Bell, UserCog, Database, Globe, Sliders, ChevronLeft } from 'lucide-react';
import GeneralSettings from './Settings/GeneralSettings';
import TeamSettings from './Settings/TeamSettings';
import NotificationSettings from './Settings/NotificationSettings';
import SecuritySettings from './Settings/SecuritySettings';
import { APP_VERSION } from '../constants';

const Settings: React.FC = () => {
  const activeTabState = useState<string | null>(null);
  const [activeTab, setActiveTab] = activeTabState;

  const categories = [
    { id: 'general', icon: Sliders, label: 'Geral', desc: 'Configurações básicas do sistema e da oficina.' },
    { id: 'team', icon: UserCog, label: 'Equipe e Permissões', desc: 'Gerencie mecânicos, consultores e acessos.' },
    { id: 'security', icon: Shield, label: 'Segurança', desc: 'Logs de auditoria, senhas e autenticação.' },
    { id: 'notifications', icon: Bell, label: 'Notificações', desc: 'Alertas de estoque, WhatsApp e lembretes.' },
    { id: 'backup', icon: Database, label: 'Dados e Backup', desc: 'Exportação de dados e sincronização.' },
    { id: 'integrations', icon: Globe, label: 'Integrações', desc: 'Conecte com meios de pagamento e ERPs externos.' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'team':
        return <TeamSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      default:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-600 hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-4">
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{cat.label}</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{cat.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900">Versão do Sistema: {APP_VERSION}</h4>
                  <p className="text-xs text-indigo-600 font-medium">Última verificação de atualização: Hoje às 08:30</p>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
      <header className="flex items-center gap-4">
        {activeTab && (
          <button
            onClick={() => setActiveTab(null)}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {activeTab ? categories.find(c => c.id === activeTab)?.label : 'Configurações'}
          </h2>
          <p className="text-slate-500 mt-1">
            {activeTab
              ? 'Gerencie as informações detalhadas desta seção.'
              : 'Personalize a experiência do Oficina Master Pro para sua empresa.'}
          </p>
        </div>
      </header>

      {renderContent()}
    </div>
  );
};

export default Settings;
