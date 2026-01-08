
import React, { useContext, useState } from 'react';
import { WorkshopContext } from '../App';
import { OSStatus, WorkshopOrder, Priority } from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../constants';
import { Plus, Search, MoreHorizontal, Clock, User as UserIcon, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react';
import OSDetailsModal from './OSDetailsModal';
import NewOSModal from './NewOSModal';

const Dashboard: React.FC = () => {
  const context = useContext(WorkshopContext);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isNewOSModalOpen, setIsNewOSModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
    const ordersInStatus = filteredOrders.filter(o => o.status === status);
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
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-6">
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Painel de Produção</h2>
          <p className="text-slate-500 text-sm font-medium">Fluxo operacional do diagnóstico à finalização.</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={mechanicFilter}
            onChange={(e) => setMechanicFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
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
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsNewOSModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Novo Check-in
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full w-full">
          {columns.map((status) => (
            <div key={status} className="flex-1 min-w-0 flex flex-col h-full bg-slate-100/50 rounded-2xl border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].color.split(' ')[0]}`}></div>
                  <h3 className="font-black text-slate-700 text-[10px] uppercase tracking-widest">{STATUS_CONFIG[status].label}</h3>
                  <span className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">
                    {getOrdersInStatus(status).length}
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenSortMenu(openSortMenu === status ? null : status)}
                    className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-lg transition-all"
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
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Ordenar por</p>
                        <button
                          onClick={() => { setColumnSort(prev => ({ ...prev, [status]: 'createdAt' })); setOpenSortMenu(null); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors text-left ${columnSort[status] === 'createdAt' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`}
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                          Ordem de Lançamento
                        </button>
                        <button
                          onClick={() => { setColumnSort(prev => ({ ...prev, [status]: 'priorityDesc' })); setOpenSortMenu(null); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors text-left ${columnSort[status] === 'priorityDesc' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          Prioridade Alta → Baixa
                        </button>
                        <button
                          onClick={() => { setColumnSort(prev => ({ ...prev, [status]: 'priorityAsc' })); setOpenSortMenu(null); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors text-left ${columnSort[status] === 'priorityAsc' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          Prioridade Baixa → Alta
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {getOrdersInStatus(status).map((order) => {
                  const vehicle = vehicles.find(v => v.id === order.vehicleId);
                  const client = vehicle ? clients.find(c => c.id === vehicle.clientId) : null;
                  const priorityInfo = PRIORITY_CONFIG[order.priority];

                  // Tonalidade sutil baseada na prioridade
                  let cardBg = "bg-white";
                  let cardBorder = "border-slate-200";

                  if (order.priority === Priority.HIGH) {
                    cardBg = "bg-red-50/60";
                    cardBorder = "border-red-600";
                  }
                  else if (order.priority === Priority.MEDIUM) {
                    cardBg = "bg-yellow-50/60";
                    cardBorder = "border-yellow-500";
                  }
                  else if (order.priority === Priority.LOW) {
                    cardBg = "bg-emerald-50/60";
                    cardBorder = "border-emerald-600";
                  }

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`${cardBg} ${cardBorder} p-4 rounded-2xl border shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">OS: #{order.id}</span>
                        <div className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityInfo.bg} ${priorityInfo.color} ${priorityInfo.border}`}>
                          {priorityInfo.label}
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm uppercase tracking-tight">
                        {vehicle?.brand} {vehicle?.model}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                        <span className="text-[10px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600 uppercase tracking-tighter">{vehicle?.plate}</span>
                        <span className="text-xs">•</span>
                        <span className="text-xs truncate font-medium">{client?.name}</span>
                      </div>

                      {order.scheduledDate && (
                        <div className="mt-3 p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">
                            {order.status === 'BUDGET' ? 'Aprovar Orçamento' :
                              (order.status === 'SCHEDULED') ? 'Agendado: Montagem' :
                                (order.status === 'EXECUTION') ? 'Agendado: Execução' : 'Agendamento'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-700 font-mono">
                            {new Date(order.scheduledDate).toLocaleDateString([], { day: '2-digit', month: '2-digit' })} {new Date(order.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {order.mechanicId ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                            <UserIcon className="w-3.5 h-3.5" />
                            <span>{mechanics.find(m => m.id === order.mechanicId)?.name || 'Mecânico'}</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                            <Plus className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
