
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Pin,
  PinOff
} from 'lucide-react';

import { WorkshopContext } from '../App';
import { signOut } from '../services/supabase';

const Sidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(() => localStorage.getItem('sidebarPinned') === 'true');
  const context = React.useContext(WorkshopContext);
  const settings = context?.settings;

  const isCollapsed = !isHovered && !isPinned;

  const togglePin = () => {
    const newState = !isPinned;
    setIsPinned(newState);
    localStorage.setItem('sidebarPinned', String(newState));
  };

  const navItems = [
    { to: '/dashboard', imgSrc: '/icon/kanban.png', label: 'Dashboard' },
    { to: '/agenda', imgSrc: '/icon/agenda.png', label: 'Agenda' },
    { to: '/clients', imgSrc: '/icon/clientes.png', label: 'Clientes' },
    { to: '/inventory', imgSrc: '/icon/pecas e servicos.png', label: 'Peças/Serviços' },
    { to: '/finance', imgSrc: '/icon/financeiro.png', label: 'Financeiro' },
    { to: '/settings', imgSrc: '/icon/configuracoes.png', label: 'Configurações' },
  ];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative h-screen bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out z-50 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div className="p-5 py-6 transition-all duration-300">
        <div className="flex items-center gap-3 mb-10 transition-all">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover shadow-sm bg-slate-50 relative z-10" />
          ) : (
            <div className="bg-indigo-600 p-2 rounded-lg shrink-0 shadow-lg shadow-indigo-100 relative z-10">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
          )}

          <h1 className={`text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed
            ? 'opacity-0 w-0 translate-x-[-10px]'
            : 'opacity-100 w-auto translate-x-0 delay-150'
            }`}>
            {settings?.nome_oficina || 'Oficina Master'}
          </h1>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center py-3 pl-2 pr-3 rounded-xl transition-all group relative overflow-hidden whitespace-nowrap ${isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.imgSrc}
                  alt={item.label}
                  className="w-6 h-6 shrink-0 transition-transform group-hover:scale-110 relative z-10 object-contain"
                />
                <span className={`font-semibold text-sm transition-all duration-300 ease-in-out ${isCollapsed
                  ? 'opacity-0 w-0 translate-x-[-10px]'
                  : 'opacity-100 w-auto translate-x-0 delay-100'
                  }`}>
                  {item.label}
                </span>
              </div>

              <ChevronRight className={`absolute right-3 w-4 h-4 transition-all duration-300 ${!isCollapsed
                ? 'opacity-0 group-hover:opacity-100 translate-x-0'
                : 'opacity-0 translate-x-4'
                }`} />
            </NavLink>
          ))}
        </nav>
      </div>

      <div className={`mt-auto p-5 py-6 border-t border-slate-100 text-slate-400 group-hover:text-red-600 transition-all duration-300 space-y-2`}>
        <button
          onClick={togglePin}
          className={`flex items-center gap-3 w-full pl-2 py-2 hover:bg-slate-50 rounded-xl transition-colors group/pin relative overflow-hidden ${isPinned ? 'text-indigo-600 bg-indigo-50' : ''}`}
        >
          {isPinned ? (
            <PinOff className={`w-5 h-5 shrink-0 transition-transform ${isPinned ? 'text-indigo-600' : 'text-slate-400 group-hover/pin:text-indigo-600'} relative z-10`} />
          ) : (
            <Pin className={`w-5 h-5 shrink-0 transition-transform ${isPinned ? 'text-indigo-600' : 'text-slate-400 group-hover/pin:text-indigo-600'} relative z-10`} />
          )}

          <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ease-in-out ${isPinned ? 'text-indigo-600' : 'text-slate-400 group-hover/pin:text-indigo-600'
            } ${isCollapsed
              ? 'opacity-0 w-0 translate-x-[-10px]'
              : 'opacity-100 w-auto translate-x-0 delay-100'
            }`}>
            {isPinned ? 'Desafixar Menu' : 'Fixar Menu'}
          </span>
        </button>

        <button
          onClick={async () => {
            try {
              await signOut();
              window.location.reload(); // Force reload to ensure clean state exit
            } catch (err) {
              console.error('Logout error:', err);
            }
          }}
          className="flex items-center gap-3 w-full pl-2 py-2 hover:bg-red-50 rounded-xl transition-colors group relative overflow-hidden"
        >
          <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110 text-slate-400 group-hover:text-red-600 relative z-10" />
          <span className={`font-semibold text-sm text-slate-400 group-hover:text-red-600 whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed
            ? 'opacity-0 w-0 translate-x-[-10px]'
            : 'opacity-100 w-auto translate-x-0 delay-100'
            }`}>
            Sair do Sistema
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
