
import React, { useContext, useState, useMemo } from 'react';
import { WorkshopContext } from '../App';
import { User, Phone, Mail, Car, CreditCard, Plus, Search, Edit3, Trash2, X, AlertTriangle } from 'lucide-react';
import ClientModal from './ClientModal';
import VehicleModal from './VehicleModal';
import { Client, Vehicle } from '../types';

const Clients: React.FC = () => {
  const context = useContext(WorkshopContext);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [vehicleModalConfig, setVehicleModalConfig] = useState<{ clientId: string; vehicle?: Vehicle | null } | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  if (!context) return null;
  const { clients, vehicles, orders, addClient, updateClient, deleteClient, addVehicle, updateVehicle, deleteVehicle } = context;

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lowerSearch = searchTerm.toLowerCase();

    return clients.filter(c => {
      // 1. Check Client Details
      if (
        c.name.toLowerCase().includes(lowerSearch) ||
        c.cpf.includes(searchTerm) ||
        c.phone.includes(searchTerm) ||
        c.email?.toLowerCase().includes(lowerSearch)
      ) return true;

      // 2. Check Linked Vehicles
      const clientVehicles = vehicles.filter(v => v.clientId === c.id);
      const vehicleMatch = clientVehicles.some(v =>
        v.model.toLowerCase().includes(lowerSearch) ||
        v.brand.toLowerCase().includes(lowerSearch) ||
        v.plate.toLowerCase().includes(lowerSearch) ||
        v.color.toLowerCase().includes(lowerSearch)
      );
      if (vehicleMatch) return true;

      // 3. Check Service History (Orders for client's vehicles)
      const clientVehicleIds = clientVehicles.map(v => v.id);
      const clientOrders = orders.filter(o => clientVehicleIds.includes(o.vehicleId));

      const historyMatch = clientOrders.some(o =>
        o.id.toLowerCase().includes(lowerSearch) ||
        o.reportedFault.toLowerCase().includes(lowerSearch) ||
        (o.diagnosis && o.diagnosis.toLowerCase().includes(lowerSearch)) ||
        new Date(o.createdAt).toLocaleDateString('pt-BR').includes(searchTerm)
      );

      return historyMatch;
    });
  }, [clients, vehicles, orders, searchTerm]);

  const handleSaveClient = (client: Client) => {
    if (clients.some(c => c.id === client.id)) {
      updateClient(client.id, client);
    } else {
      addClient(client);
    }
    setIsClientModalOpen(false);
    setEditingClient(null);
  };

  const handleSaveVehicle = (vehicle: Vehicle) => {
    if (vehicles.some(v => v.id === vehicle.id)) {
      updateVehicle(vehicle.id, vehicle);
    } else {
      addVehicle(vehicle);
    }
    setVehicleModalConfig(null);
  };

  const confirmDeleteVehicle = () => {
    if (vehicleToDelete) {
      deleteVehicle(vehicleToDelete.id);
      setVehicleToDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden bg-slate-100/50">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Clientes & Frota</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Base de dados unificada</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisa avançada"
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-56 md:w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
          {filteredClients.length > 0 ? filteredClients.map(client => {
            const clientVehicles = vehicles.filter(v => v.clientId === client.id);

            return (
              <div key={client.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 transition-all group flex flex-col shadow-sm">

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight truncate max-w-[150px]">{client.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-300 bg-slate-50 px-1 rounded">#{client.id}</span>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{client.cpf}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingClient(client);
                        setIsClientModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir ${client.name}? Todos os veículos serão removidos.`)) deleteClient(client.id);
                      }}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold truncate">
                    <Phone className="w-3 h-3 text-slate-300" /> {client.phone}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold truncate">
                    <Mail className="w-3 h-3 text-slate-300" /> {client.email}
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Car className="w-3 h-3" /> Frota ({clientVehicles.length})
                    </span>
                    <button
                      onClick={() => setVehicleModalConfig({ clientId: client.id })}
                      className="text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      + Vincular
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {clientVehicles.slice(0, 3).map(v => (
                      <div
                        key={v.id}
                        className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-2 group/car hover:border-indigo-200 transition-all cursor-pointer"
                        onClick={() => setVehicleModalConfig({ clientId: client.id, vehicle: v })}
                      >
                        <span className="text-[9px] font-black text-slate-700 uppercase">{v.model}</span>
                        <span className="text-[8px] font-mono font-bold text-slate-400">{v.plate}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVehicleToDelete(v);
                          }}
                          className="p-0.5 hover:text-red-500 opacity-0 group-hover/car:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    {clientVehicles.length > 3 && (
                      <div className="px-2 py-1 rounded-lg border border-dashed border-slate-200 text-[8px] font-bold text-slate-400">
                        +{clientVehicles.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full h-48 flex flex-col items-center justify-center bg-white/50 border border-dashed border-slate-200 rounded-2xl">
              <User className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Client Modal */}
      {(isClientModalOpen || editingClient) && (
        <ClientModal
          client={editingClient}
          onClose={() => {
            setIsClientModalOpen(false);
            setEditingClient(null);
          }}
          onSave={handleSaveClient}
        />
      )}

      {/* Vehicle Modal */}
      {vehicleModalConfig && (
        <VehicleModal
          clientId={vehicleModalConfig.clientId}
          vehicle={vehicleModalConfig.vehicle}
          onClose={() => setVehicleModalConfig(null)}
          onSave={handleSaveVehicle}
        />
      )}

      {/* Vehicle Deletion Confirmation Modal */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setVehicleToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-1">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">Remover Veículo?</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Tem certeza que deseja remover o veículo <span className="text-slate-800 font-black">{vehicleToDelete.model}</span> <span className="font-mono text-slate-400">({vehicleToDelete.plate})</span> da frota deste cliente?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <button
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
                  onClick={() => setVehicleToDelete(null)}
                >
                  Cancelar
                </button>
                <button
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                  onClick={confirmDeleteVehicle}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
