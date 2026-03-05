
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Maximize,
  Minimize,
} from 'lucide-react';

import { WorkshopContext } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { signOut } from '../services/supabase';

const Sidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const context = React.useContext(WorkshopContext);
  const { theme, sidebarMode } = useTheme();

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
      console.error('Error toggling full-screen mode:', err);
    }
  };

  const settings = context?.settings;

  const isCollapsed = React.useMemo(() => {
    if (sidebarMode === 'fixed-open') return false;
    if (sidebarMode === 'fixed-closed') return true;
    return !isHovered;
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
      className={`
        relative h-screen flex flex-col shrink-0 z-50
        transition-all duration-300 ease-in-out
        bg-white dark:bg-dark-sidebar
        border-r border-slate-200 dark:border-dark-border
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* ── HEADER ─────────────────────────────── */}
      <div className="p-5 py-6">
        <div className="flex items-center gap-3 mb-10">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt="Logo"
              className="w-10 h-10 rounded-lg object-cover shadow-sm bg-slate-50 dark:bg-dark-card"
            />
          ) : (
            <div className="bg-crimson p-2 rounded-lg shrink-0 shadow-lg shadow-red-900/30">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
          )}

          <h1 className={`
            text-lg font-bold text-slate-900 dark:text-slate-100
            tracking-tight whitespace-nowrap overflow-hidden
            transition-all duration-300 ease-in-out
            ${isCollapsed ? 'opacity-0 w-0 -translate-x-2' : 'opacity-100 w-auto translate-x-0 delay-150'}
          `}>
            {settings?.nome_oficina || 'Oficina Master'}
          </h1>
        </div>

        {/* ── NAV ITEMS ── */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center py-3 pl-2 pr-3 rounded-xl transition-all group relative overflow-hidden whitespace-nowrap border ${isActive
                  ? 'bg-crimson-light text-crimson-text border-crimson/20 dark:bg-crimson-light dark:text-crimson-text'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-hover hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.imgSrc}
                  alt={item.label}
                  className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-110 object-contain ${theme === 'dark' ? 'invert opacity-75' : ''}`}
                />
                <span className={`
                  font-semibold text-sm
                  transition-all duration-300 ease-in-out
                  ${isCollapsed ? 'opacity-0 w-0 -translate-x-2' : 'opacity-100 w-auto translate-x-0 delay-100'}
                `}>
                  {item.label}
                </span>
              </div>

              <ChevronRight className={`
                absolute right-3 w-4 h-4 text-current
                transition-all duration-300
                ${!isCollapsed ? 'opacity-0 group-hover:opacity-60' : 'opacity-0'}
              `} />
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── FOOTER ─────────────────────────────── */}
      <div className="mt-auto p-5 py-6 border-t border-slate-100 dark:border-dark-border space-y-1">

        {/* Fullscreen toggle */}
        <div
          onClick={toggleFullScreen}
          title={isFullScreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          className={`
            flex items-center justify-between w-full pl-2 pr-2 py-2
            rounded-xl transition-colors group cursor-pointer
            ${isFullScreen
              ? 'text-crimson-text bg-crimson-light border border-crimson/20'
              : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-dark-hover'
            }
          `}
        >
          <div className="flex items-center gap-3">
            {isFullScreen
              ? <Minimize className="w-5 h-5 shrink-0 text-crimson-text" />
              : <Maximize className="w-5 h-5 shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-crimson" />
            }
          </div>
          {!isCollapsed && (
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isFullScreen ? 'bg-crimson' : 'bg-slate-300 dark:bg-dark-elevated'}`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isFullScreen ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={async () => {
            try {
              await signOut();
              window.location.reload();
            } catch (err) {
              console.error('Logout error:', err);
            }
          }}
          className="flex items-center gap-3 w-full pl-2 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors group"
        >
          <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110 text-slate-400 dark:text-slate-500 group-hover:text-red-600 dark:group-hover:text-priority-high" />
          <span className={`
            font-semibold text-sm text-slate-400 dark:text-slate-500
            group-hover:text-red-600 dark:group-hover:text-priority-high
            whitespace-nowrap transition-all duration-300 ease-in-out
            ${isCollapsed ? 'opacity-0 w-0 -translate-x-2' : 'opacity-100 w-auto translate-x-0 delay-100'}
          `}>
            Sair do Sistema
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
