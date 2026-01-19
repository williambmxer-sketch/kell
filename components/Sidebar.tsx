
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Pin,
  PinOff,
  Maximize,
  Minimize,
  Moon,
  Sun
} from 'lucide-react';

import { WorkshopContext } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { signOut } from '../services/supabase';

const Sidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const context = React.useContext(WorkshopContext);
  const { theme, toggleTheme, sidebarMode } = useTheme();

  React.useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to toggle full-screen mode:", err);
    }
  };
  const settings = context?.settings;

  const isCollapsed = React.useMemo(() => {
    if (sidebarMode === 'fixed-open') return false;
    if (sidebarMode === 'fixed-closed') return true;
    return !isHovered; // automatic
  }, [sidebarMode, isHovered]);

  const navItems = [
    { to: '/dashboard', imgSrc: '/icon/kanban.png', label: 'Dashboard' },
    { to: '/agenda', imgSrc: '/icon/agenda.png', label: 'Agenda' },
    { to: '/clients', imgSrc: '/icon/clientes.png', label: 'Clientes' },
    { to: '/inventory', imgSrc: '/icon/pecas e servicos.png', label: 'Cadastros' },
    { to: '/finance', imgSrc: '/icon/financeiro.png', label: 'Financeiro' },
    { to: '/settings', imgSrc: '/icon/configuracoes.png', label: 'Configurações' },
  ];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out z-50 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div className="p-5 py-6 transition-all duration-300">
        <div className="flex items-center gap-3 mb-10 transition-all">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover shadow-sm bg-slate-50 dark:bg-slate-800 relative z-10" />
          ) : (
            <div className="bg-indigo-600 p-2 rounded-lg shrink-0 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30 relative z-10">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
          )}

          <h1 className={`text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed
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
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.imgSrc}
                  alt={item.label}
                  className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-110 relative z-10 object-contain ${theme === 'dark' ? 'invert opacity-80' : ''}`}
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

      <div className={`mt-auto p-5 py-6 border-t border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-red-600 transition-all duration-300 space-y-2`}>

        {/* Theme Toggle */}

        <div
          onClick={toggleFullScreen}
          title={isFullScreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          className={`flex items-center justify-between w-full pl-2 pr-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group relative overflow-hidden cursor-pointer ${isFullScreen ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-slate-400 dark:text-slate-500'}`}
        >
          <div className="flex items-center gap-3">
            {isFullScreen ? (
              <Minimize className={`w-5 h-5 shrink-0 transition-transform ${isFullScreen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600'} relative z-10`} />
            ) : (
              <Maximize className={`w-5 h-5 shrink-0 transition-transform ${isFullScreen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600'} relative z-10`} />
            )}
          </div>

          {!isCollapsed && (
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isFullScreen ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isFullScreen ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          )}
        </div>

        <button
          onClick={async () => {
            try {
              await signOut();
              window.location.reload(); // Force reload to ensure clean state exit
            } catch (err) {
              console.error('Logout error:', err);
            }
          }}
          className="flex items-center gap-3 w-full pl-2 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors group relative overflow-hidden"
        >
          <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110 text-slate-400 dark:text-slate-500 group-hover:text-red-600 dark:group-hover:text-red-400 relative z-10" />
          <span className={`font-semibold text-sm text-slate-400 dark:text-slate-500 group-hover:text-red-600 dark:group-hover:text-red-400 whitespace-nowrap transition-all duration-300 ease-in-out ${isCollapsed
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
