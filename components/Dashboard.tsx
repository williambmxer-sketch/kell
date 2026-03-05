import React, { useContext, useState } from 'react';
import { WorkshopContext } from '../App';
import { OSStatus, WorkshopOrder, Priority } from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../constants';
import { Plus, Search, MoreHorizontal, Clock, User as UserIcon, ArrowUp, ArrowDown, ListOrdered, Sparkles, Briefcase, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import OSDetailsModal from './OSDetailsModal';
import NewOSModal from './NewOSModal';
import { formatScheduledDate, formatScheduledTime } from '../utils/date';

const Dashboard: React.FC = () => {
  const context = useContext(WorkshopContext);
  const { theme, toggleTheme } = useTheme();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isNewOSModalOpen, setIsNewOSModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Date Range Filter State
  const [isDateFilterEnabled, setIsDateFilterEnabled] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 10);
    const end = new Date();
    end.setDate(end.getDate() + 20);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  });

  const [openSortMenu, setOpenSortMenu] = useState<OSStatus | null>(null);
  const [columnSort, setColumnSort] = useState<Record<OSStatus, 'createdAt' | 'priorityAsc' | 'priorityDesc'>>({
    [OSStatus.RECEPTION]: 'createdAt',
    [OSStatus.BUDGET]: 'createdAt',
    [OSStatus.APPROVAL]: 'createdAt',
    [OSStatus.SCHEDULED]: 'createdAt',
    [OSStatus.EXECUTION]: 'createdAt',
    [OSStatus.FINISHED]: 'createdAt'
  });

  if (!context) return null;

  const { orders, vehicles, clients, mechanics } = context;
  const [mechanicFilter, setMechanicFilter] = useState<string>('all');

  // Filtrando para não exibir RECEPTION
  const columns: OSStatus[] = Object.values(OSStatus).filter(status => status !== OSStatus.RECEPTION);

  const filteredOrders = orders.filter(o => {
    const vehicle = vehicles.find(v => v.id === o.vehicleId);
    const client = vehicle ? clients.find(c => c.id === vehicle.clientId) : null;
    const searchStr = `${o.id} ${vehicle?.model} ${vehicle?.plate} ${client?.name}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesMechanic = mechanicFilter === 'all' || o.mechanicId === mechanicFilter;

    return matchesSearch && matchesMechanic;
  });

  const getOrdersInStatus = (status: OSStatus) => {
    let ordersInStatus = filteredOrders.filter(o => o.status === status);

    // Filtro de data só na coluna Finalizado
    if (status === OSStatus.FINISHED && isDateFilterEnabled) {
      ordersInStatus = ordersInStatus.filter(o => {
        const targetDateStr = o.scheduledDate
          ? o.scheduledDate.split('T')[0]
          : o.createdAt.split('T')[0];
        return (
          (!dateRange.start || targetDateStr >= dateRange.start) &&
          (!dateRange.end || targetDateStr <= dateRange.end)
        );
      });
    }

    const sortType = columnSort[status];

    // Priority weight: HIGH=3, MEDIUM=2, LOW=1
    const priorityWeight = (p: Priority): number => {
      if (p === Priority.HIGH) return 3;
      if (p === Priority.MEDIUM) return 2;
      return 1;
    };

    if (sortType === 'priorityAsc') {
      return [...ordersInStatus].sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority));
    } else if (sortType === 'priorityDesc') {
      return [...ordersInStatus].sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
    } else {
      // Default: by createdAt (most recent first)
      return [...ordersInStatus].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6 transition-colors duration-300">
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Painel de Produção</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Fluxo operacional do diagnóstico à finalização.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Date Filter Inputs */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm transition-opacity duration-200">
            <div className="flex items-center gap-2 px-2 border-r border-slate-200 dark:border-slate-800">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isDateFilterEnabled}
                  onChange={(e) => setIsDateFilterEnabled(e.target.checked)}
                />
                <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {isDateFilterEnabled ? 'ON' : 'OFF'}
                </span>
              </label>
            </div>
            <div className={`flex items-center gap-2 transition-opacity duration-200 ${!isDateFilterEnabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-0 w-24 uppercase tracking-tighter text-right"
                disabled={!isDateFilterEnabled}
              />
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-0 w-24 uppercase tracking-tighter"
                disabled={!isDateFilterEnabled}
              />
            </div>
          </div>

          {/* ─── Day / Night Toggle ─── */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            aria-label={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            style={{
              width: 64,
              height: 32,
              borderRadius: 999,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: theme === 'dark'
                ? 'inset 0 2px 6px rgba(0,0,0,0.6), 0 0 0 1.5px #2A2A2A'
                : 'inset 0 2px 6px rgba(0,0,0,0.15), 0 0 0 1.5px #CBD5E1',
              background: theme === 'dark'
                ? 'linear-gradient(180deg, #0B0F1A 0%, #1A2540 100%)'
                : 'linear-gradient(180deg, #60C6F5 0%, #A8DFFE 100%)',
              transition: 'background 0.5s ease, box-shadow 0.4s ease',
            }}
          >
            {/* Stars (night) */}
            {['12%,28%', '30%,14%', '50%,22%', '68%,10%', '22%,48%', '45%,42%'].map((pos, i) => {
              const [l, t] = pos.split(',');
              return (
                <span key={i} style={{
                  position: 'absolute',
                  left: l, top: t,
                  width: i % 2 === 0 ? 2 : 1.5,
                  height: i % 2 === 0 ? 2 : 1.5,
                  borderRadius: '50%',
                  background: '#ffffff',
                  opacity: theme === 'dark' ? (0.5 + i * 0.08) : 0,
                  transition: 'opacity 0.4s ease',
                  transitionDelay: `${i * 40}ms`,
                }} />
              );
            })}

            {/* Cloud (day) */}
            <span style={{
              position: 'absolute',
              right: 8,
              top: 8,
              width: 26,
              height: 14,
              opacity: theme === 'dark' ? 0 : 1,
              transform: theme === 'dark' ? 'translateX(10px)' : 'translateX(0)',
              transition: 'opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s',
            }}>
              <svg viewBox="0 0 52 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <ellipse cx="20" cy="16" rx="14" ry="8" fill="white" fillOpacity="0.9" />
                <ellipse cx="30" cy="18" rx="10" ry="6" fill="white" fillOpacity="0.85" />
                <ellipse cx="14" cy="18" rx="8" ry="6" fill="white" fillOpacity="0.75" />
                <circle cx="20" cy="10" r="8" fill="white" fillOpacity="0.95" />
                <circle cx="30" cy="12" r="6" fill="white" fillOpacity="0.9" />
              </svg>
            </span>

            {/* Thumb: Sun (day) / Moon (night) */}
            <span style={{
              position: 'absolute',
              top: 3,
              left: theme === 'dark' ? 33 : 3,
              width: 26,
              height: 26,
              borderRadius: '50%',
              transition: 'left 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
              background: theme === 'dark'
                ? 'radial-gradient(circle at 60% 40%, #D8D8D8 0%, #A8A8A8 60%, #808080 100%)'
                : 'radial-gradient(circle at 40% 35%, #FFE566 0%, #FFD000 55%, #FFA500 100%)',
              boxShadow: theme === 'dark'
                ? '2px 2px 6px rgba(0,0,0,0.5), inset -2px -1px 4px rgba(0,0,0,0.3)'
                : '0 2px 8px rgba(255,180,0,0.6), inset -1px -1px 3px rgba(255,120,0,0.3)',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {/* Moon craters */}
              {theme === 'dark' && (
                <>
                  <span style={{ position: 'absolute', top: 6, left: 6, width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,0,0,0.18)' }} />
                  <span style={{ position: 'absolute', top: 13, left: 9, width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.14)' }} />
                  <span style={{ position: 'absolute', top: 8, left: 14, width: 3, height: 3, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
                </>
              )}
            </span>
          </button>
          <select
            value={mechanicFilter}
            onChange={(e) => setMechanicFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-colors"
          >
            <option value="all">Todos os Mecânicos</option>
            {mechanics.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por placa, cliente ou OS..."
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsNewOSModalOpen(true)}
            className="bg-[#E52020] hover:bg-[#C01A1A] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-red-900/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Novo Check-in
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full w-full">
          {columns.map((status) => {
            const isFinished = status === OSStatus.FINISHED;
            return (
              <div
                key={status}
                className={`flex-1 min-w-0 flex flex-col h-full rounded-2xl border transition-colors duration-300 ${isFinished
                  ? 'bg-slate-200 dark:bg-[#141414] border-slate-300 dark:border-[#2A2A2A] opacity-80 saturate-50'
                  : 'bg-slate-100 dark:bg-[#161616] border-slate-200 dark:border-[#2A2A2A]'
                  }`}
              >
                <div className="p-4 border-b border-slate-200 dark:border-[#2A2A2A] flex items-center justify-between bg-slate-50 dark:bg-[#1A1A1A] rounded-t-2xl transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].color.split(' ')[0]}`}></div>
                    <h3 className="font-black text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-widest">{STATUS_CONFIG[status].label}</h3>
                    <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm transition-colors">
                      {getOrdersInStatus(status).length}
                    </span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenSortMenu(openSortMenu === status ? null : status)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openSortMenu === status && (
                      <>
                        {/* Invisible overlay to close menu when clicking outside */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenSortMenu(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest px-3 py-2">Ordenar por</p>
                          <button
                            onClick={() => { setColumnSort(prev => ({ ...prev, [status]: 'createdAt' })); setOpenSortMenu(null); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#222222] transition-colors text-left ${columnSort[status] === 'createdAt' ? 'text-[#E52020] dark:text-[#FF5050] bg-red-50 dark:bg-[#2A1010]' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            <ListOrdered className="w-3.5 h-3.5" />
                            Ordem de Lançamento
                          </button>
                          <button
                            onClick={() => { setColumnSort(prev => ({ ...prev, [status]: 'priorityDesc' })); setOpenSortMenu(null); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#222222] transition-colors text-left ${columnSort[status] === 'priorityDesc' ? 'text-[#E52020] dark:text-[#FF5050] bg-red-50 dark:bg-[#2A1010]' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                            Prioridade Alta → Baixa
                          </button>
                          <button
                            onClick={() => { setColumnSort(prev => ({ ...prev, [status]: 'priorityAsc' })); setOpenSortMenu(null); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#222222] transition-colors text-left ${columnSort[status] === 'priorityAsc' ? 'text-[#E52020] dark:text-[#FF5050] bg-red-50 dark:bg-[#2A1010]' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                            Prioridade Baixa → Alta
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {getOrdersInStatus(status).map((order) => {
                    const vehicle = vehicles.find(v => v.id === order.vehicleId);
                    const client = vehicle ? clients.find(c => c.id === vehicle.clientId) : null;
                    const priorityInfo = PRIORITY_CONFIG[order.priority];

                    // Tonalidade sutil baseada na prioridade (Adaptação Dark Mode)
                    let cardBg = "bg-white dark:bg-slate-800";
                    let cardBorder = "border-slate-200 dark:border-slate-700";

                    // Priority Styles — sólidos, sem transparências
                    if (order.priority === Priority.HIGH) {
                      cardBg = "bg-red-50 dark:bg-[#2A0D0D]";
                      cardBorder = "border-red-300 dark:border-[#5A1A1A]";
                    }
                    else if (order.priority === Priority.MEDIUM) {
                      cardBg = "bg-amber-50 dark:bg-[#2A1A08]";
                      cardBorder = "border-amber-300 dark:border-[#5A3A10]";
                    }
                    else if (order.priority === Priority.LOW) {
                      cardBg = "bg-emerald-50 dark:bg-[#0D2218]";
                      cardBorder = "border-emerald-300 dark:border-[#1A4A2A]";
                    }

                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`${cardBg} ${cardBorder} p-4 rounded-2xl border shadow-sm hover:shadow-md dark:hover:shadow-[0_0_0_1px_rgba(229,32,32,0.25)] dark:hover:border-[#E52020]/30 transition-all cursor-pointer group`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-[#E52020] dark:text-[#FF5050] bg-[#F3E8E8] dark:bg-[#2A1010] border border-red-200 dark:border-[#E52020]/20 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">OS: #{order.id}</span>
                          <div className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityInfo.bg} ${priorityInfo.color} ${priorityInfo.border}`}>
                            {priorityInfo.label}
                          </div>
                        </div>

                        <h4 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#E52020] dark:group-hover:text-[#FF5050] transition-colors text-sm uppercase tracking-tight">
                          {vehicle?.brand} {vehicle?.model}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-slate-500 dark:text-slate-400">
                          <span className="text-[10px] bg-slate-100 dark:bg-[#2A2A2A] border border-slate-200 dark:border-[#3A3A3A] px-1.5 py-0.5 rounded font-mono font-bold text-slate-700 dark:text-[#CCCCCC] uppercase tracking-tighter">{vehicle?.plate}</span>
                          <span className="text-xs">•</span>
                          <span className="text-xs truncate font-medium">{client?.name}</span>
                        </div>

                        {order.scheduledDate && (
                          <div className="mt-3 p-2 bg-slate-100 dark:bg-[#1E1E1E] border border-slate-200 dark:border-[#333333] rounded-lg flex items-center justify-between transition-colors">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#E52020] dark:text-[#E52020]">
                              {order.status === 'FINISHED' ? 'Finalizado' :
                                (order.status === 'BUDGET') ? 'Aprovar Orçamento' :
                                  (order.status === 'SCHEDULED') ? 'Agendado: Montagem' :
                                    (order.status === 'EXECUTION') ? 'Agendado: Execução' : 'Agendamento'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-800 dark:text-[#DDDDDD] font-mono">
                              {formatScheduledDate(order.scheduledDate)} {formatScheduledTime(order.scheduledDate)}
                            </span>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#2A2A2A] flex items-center justify-between text-slate-400 dark:text-[#777777]">
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {order.items?.some(i => i.waitingForParts) ? (
                            (() => {
                              const waitingItem = order.items.find(i => i.waitingForParts);
                              const date = waitingItem?.expectedArrival ? new Date(waitingItem.expectedArrival) : null;
                              const dateStr = date ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '---';
                              return (
                                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-[#2A1A08] border border-amber-200 dark:border-[#5A3A10] px-2 py-1 rounded-full">
                                  <Clock className="w-3 h-3 text-amber-600 dark:text-[#D97706]" />
                                  <span className="text-[9px] font-black text-amber-700 dark:text-[#D97706] uppercase tracking-tight">Aguardando peça {dateStr}</span>
                                </div>
                              )
                            })()
                          ) : order.mechanicId ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-[#E52020] dark:text-[#E52020] uppercase tracking-widest">
                              <UserIcon className="w-3.5 h-3.5" />
                              <span>{mechanics.find(m => m.id === order.mechanicId)?.name || 'Mecânico'}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedOrder && (
        <OSDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrderId(null)}
        />
      )}

      {isNewOSModalOpen && (
        <NewOSModal onClose={() => setIsNewOSModalOpen(false)} />
      )}
    </div>
  );
};


export default Dashboard;
