
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { WorkshopContext } from '../App';
import { OSStatus, Priority, VehicleCategory, Client, Vehicle, WorkshopOrder } from '../types';
import { X, Search, Car, User, Plus, ChevronRight, Briefcase, Sparkles, UserCheck, ChevronLeft } from 'lucide-react';

interface NewOSModalProps {
  onClose: () => void;
}

const NewOSModal: React.FC<NewOSModalProps> = ({ onClose }) => {
  const context = useContext(WorkshopContext);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedGearbox, setSelectedGearbox] = useState<import('../types').Gearbox | null>(null); // To store selected gearbox before creation
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState({ plate: '', color: '', year: new Date().getFullYear().toString(), model: '' }); // Plate, Color, Year, Model (friendly name)

  const [clientSearch, setClientSearch] = useState('');
  const [gearboxSearch, setGearboxSearch] = useState('');
  const [isRegisteringClient, setIsRegisteringClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', cpf: '', email: '', zipCode: '', address: '', addressNumber: '', neighborhood: '', city: '', state: '' });
  const [fault, setFault] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [category, setCategory] = useState<VehicleCategory>(VehicleCategory.PRIVATE);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [isRegisteringGearbox, setIsRegisteringGearbox] = useState(false);
  const [newGearboxData, setNewGearboxData] = useState({ model: '', type: 'MANUAL', specs: '5 Marchas', assemblyTime: '' });

  /* Logic for CEP Autofill */
  const handleZipCodeBlur = async () => {
    const cep = newClient.zipCode?.replace(/\D/g, '');
    if (cep && cep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setNewClient(prev => ({
            ...prev,
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const filteredGearboxes = useMemo(() => {
    if (!context || !selectedBrand) return [];
    const list = context.gearboxes.filter(e => e.brand === selectedBrand);
    if (!gearboxSearch) return list;
    return list.filter(g => g.model.toLowerCase().includes(gearboxSearch.toLowerCase()));
  }, [context, selectedBrand, gearboxSearch]);

  const clientVehicles = useMemo(() => {
    if (!context || !selectedClient) return [];
    return context.vehicles.filter(v => v.clientId === selectedClient.id);
  }, [context, selectedClient]);

  const handleCloseInternal = () => {
    if (isRegisteringClient) {
      setIsRegisteringClient(false);
      return;
    }
    if (isRegisteringGearbox) {
      setIsRegisteringGearbox(false);
      return;
    }
    // If inside vehicle creation flow (Step 2 sub-steps), handle back navigation or close?
    // We'll let strict step navigation handle back.
    onClose();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCloseInternal(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, isRegisteringClient, isRegisteringGearbox]);

  if (!context) return null;

  const { addClient, addVehicle, addNewOrder, vehicles, clients, addHistoryLog, brands, addGearbox } = context;

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.cpf.includes(clientSearch));
  }, [clients, clientSearch]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = `c-${Date.now()}`;
      const clientData: Client = { ...newClient, id };

      const createdClient = await addClient(clientData);
      if (createdClient) {
        setSelectedClient(createdClient);
        setIsRegisteringClient(false);
        setStep(2);
      } else {
        alert("Erro ao cadastrar cliente. Verifique se o banco de dados está conectado e se os campos estão válidos.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro inesperado ao cadastrar cliente.");
    }
  };

  const handleCreateGearbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;

    try {
      // Generate Code
      const existingCodes = context.gearboxes?.map(g => g.code) || [];
      const numbers = existingCodes
        .map(c => parseInt(c.replace('AUTO-', '')))
        .filter(n => !isNaN(n));

      const max = numbers.length > 0 ? Math.max(...numbers) : 0;
      const next = max + 1;
      const generatedCode = `AUTO-${next.toString().padStart(4, '0')}`;

      const newGearbox: import('../types').Gearbox = {
        id: `g-${Date.now()}`,
        brand: selectedBrand,
        model: newGearboxData.model,
        type: newGearboxData.type,
        specs: newGearboxData.specs,
        assemblyTime: newGearboxData.assemblyTime,
        code: generatedCode
      };

      await addGearbox(newGearbox);
      setSelectedGearbox(newGearbox);
      setIsRegisteringGearbox(false);
      // Removed alert confirmation to keep flow smooth, selection is immediate.
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar modelo de câmbio.");
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedGearbox) return;

    try {
      const newVehicle: Vehicle = {
        id: `v-${Date.now()}`,
        clientId: selectedClient.id,
        brand: selectedGearbox.brand,
        model: newVehicleData.model || selectedGearbox.model, // Use friendly name or fallback to gearbox model
        plate: newVehicleData.plate.toUpperCase(),
        color: newVehicleData.color.toUpperCase(),
        year: parseInt(newVehicleData.year) || new Date().getFullYear()
      };

      const createdVehicle = await addVehicle(newVehicle);
      if (createdVehicle) {
        setSelectedVehicle(createdVehicle);
        setStep(3);
      } else {
        alert("Erro ao cadastrar veículo.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro inesperado ao cadastrar veículo.");
    }
  };

  const selectExistingVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setStep(3);
  };

  const parseDuration = (timeStr?: string): number => {
    if (!timeStr) return 0;
    let totalMinutes = 0;

    // Extract hours
    const hoursMatch = timeStr.match(/(\d+)h/);
    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;

    // Extract minutes
    const minMatch = timeStr.match(/(\d+)min/);
    if (minMatch) totalMinutes += parseInt(minMatch[1]);

    return totalMinutes;
  }

  const handleSubmitOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      // Attempt to find duration from Gearbox
      let estimatedDuration = 0;
      if (selectedVehicle) {
        // Try to find the gearbox matching this vehicle
        const gearbox = context.gearboxes.find(g => g.brand === selectedVehicle.brand && g.model === selectedVehicle.model);
        if (gearbox && gearbox.assemblyTime) {
          estimatedDuration = parseDuration(gearbox.assemblyTime);
        }
      }

      const newOrder: WorkshopOrder = {
        id: `OS-${Math.floor(100 + Math.random() * 900)}`,
        vehicleId: selectedVehicle.id,
        status: OSStatus.BUDGET,
        priority,
        category,
        km: 0,
        fuelLevel: 50,
        reportedFault: fault,
        items: [],
        estimatedDuration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = await addNewOrder(newOrder);
      if (result) {
        // Only log history and close if successful
        await addHistoryLog(result.id, 'Abertura de OS', `Recepcionado direto em Orçamento. Relato: ${fault} | Tipo: ${category} | Prioridade: ${priority}`);
        onClose();
      } else {
        alert("Erro ao criar Ordem de Serviço. Tente novamente.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro inesperado ao criar OS.");
    }
  };

  const inputClasses = "w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 text-[11px] font-medium";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseInternal}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {(step > 1 || isRegisteringClient || isCreatingVehicle || selectedBrand || selectedGearbox) && (
                <button onClick={() => {
                  if (isRegisteringClient) setIsRegisteringClient(false);
                  else if (step === 2) {
                    if (selectedGearbox) setSelectedGearbox(null);
                    else if (selectedBrand) setSelectedBrand('');
                    else if (isCreatingVehicle) setIsCreatingVehicle(false);
                    else setStep(1);
                  }
                  else setStep(prev => (prev - 1) as any);
                }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors -ml-2">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Check-in Oficina</h2>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Etapa {step}/5</p>
              </div>
            </div>
            <button onClick={handleCloseInternal} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="flex gap-1.5 h-1.5 w-full">
            {[1, 2, 3, 4, 5].map(s => <div key={s} className={`flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>)}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto max-h-[70vh]">
          {isRegisteringClient ? (
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input required className={inputClasses} value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Nome do cliente" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                  <input required className={inputClasses} value={newClient.cpf} onChange={e => setNewClient({ ...newClient, cpf: e.target.value })} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fone</label>
                  <input required className={inputClasses} value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
              </div>

              {/* Address Section */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-3 block">Endereço Completo</label>

                <div className="grid grid-cols-[120px_1fr] gap-3 mb-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                    <input
                      className={inputClasses.replace('p-2.5', 'p-2.5 w-full')}
                      value={newClient.zipCode || ''}
                      onChange={e => setNewClient({ ...newClient, zipCode: e.target.value })}
                      onBlur={handleZipCodeBlur}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço</label>
                    <input
                      className={inputClasses}
                      value={newClient.address || ''}
                      onChange={e => setNewClient({ ...newClient, address: e.target.value })}
                      placeholder={isLoadingCep ? 'Carregando...' : 'Rua...'}
                      disabled={isLoadingCep}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[80px_1fr] gap-3 mb-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                    <input
                      className={inputClasses}
                      value={newClient.addressNumber || ''}
                      onChange={e => setNewClient({ ...newClient, addressNumber: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                    <input
                      className={inputClasses}
                      value={newClient.neighborhood || ''}
                      onChange={e => setNewClient({ ...newClient, neighborhood: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_60px] gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                    <input
                      className={inputClasses}
                      value={newClient.city || ''}
                      onChange={e => setNewClient({ ...newClient, city: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">UF</label>
                    <input
                      className={inputClasses}
                      value={newClient.state || ''}
                      onChange={e => setNewClient({ ...newClient, state: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsRegisteringClient(false)} className="flex-1 py-3 text-slate-400 font-black text-[10px] uppercase border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-xl">Confirmar</button>
              </div>
            </form>
          ) : (
            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Buscar cliente..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} /></div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <button onClick={() => setIsRegisteringClient(true)} className="w-full py-3 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">+ NOVO CLIENTE</button>
                    {filteredClients.map(c => <button key={c.id} onClick={() => { setSelectedClient(c); setStep(2); }} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><User className="w-4 h-4" /></div><div><p className="font-bold text-slate-900 text-xs uppercase">{c.name}</p><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{c.cpf}</p></div></div><ChevronRight className="w-4 h-4 text-slate-300" /></button>)}
                  </div>
                </div>
              )}

              {step === 2 && selectedClient && (
                <div className="space-y-4">
                  {/* Veículos do Cliente EXISTENTES */}
                  {!isCreatingVehicle && clientVehicles.length > 0 && !selectedBrand ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Veículos Cadastrados</p>
                      </div>
                      <div className="space-y-2">
                        {clientVehicles.map(v => (
                          <button key={v.id} onClick={() => selectExistingVehicle(v)} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-left group">
                            <div className="flex items-center gap-3">
                              <Car className="w-5 h-5 text-slate-400" />
                              <div>
                                <p className="font-bold text-slate-900 text-xs uppercase group-hover:text-indigo-600">{v.brand} {v.model}</p>
                                <p className="text-[9px] font-mono text-slate-400 uppercase">{v.plate} • {v.color}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </button>
                        ))}
                        <button onClick={() => setIsCreatingVehicle(true)} className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 font-black text-[10px] uppercase tracking-widest">+ Adicionar Novo Veículo</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* FLUXO DE CRIAÇÃO (Ou se não tiver carros) */}
                      {(isCreatingVehicle || clientVehicles.length === 0) && (
                        <div className="space-y-4">
                          {/* Se já selecionou Gearbox -> Form de Cadastro */}
                          {selectedGearbox ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="flex items-center gap-2 mb-4 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                <Car className="w-5 h-5 text-indigo-600" />
                                <div>
                                  <p className="text-xs font-black text-indigo-900 uppercase">{selectedGearbox.brand} {selectedGearbox.model}</p>
                                  <p className="text-[9px] text-indigo-500 uppercase">{selectedGearbox.specs}</p>
                                </div>
                              </div>
                              <form onSubmit={handleCreateVehicle} className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Veículo</label>
                                  <input required autoFocus className={inputClasses} value={newVehicleData.model} onChange={e => setNewVehicleData({ ...newVehicleData, model: e.target.value })} placeholder="Ex: Cruze, Civic, Onix..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa</label><input required className={inputClasses} value={newVehicleData.plate} onChange={e => setNewVehicleData({ ...newVehicleData, plate: e.target.value.toUpperCase() })} placeholder="ABC-1234" /></div>
                                  <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ano</label><input type="number" required className={inputClasses} value={newVehicleData.year} onChange={e => setNewVehicleData({ ...newVehicleData, year: e.target.value })} /></div>
                                </div>
                                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-xl mt-2 shadow-lg hover:bg-indigo-700 transition-all">Cadastrar Veículo</button>
                              </form>
                            </div>
                          ) : (
                            /* Seleção de Marca / Câmbio */
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  {isRegisteringGearbox && (
                                    <button onClick={() => setIsRegisteringGearbox(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>
                                  )}
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {isRegisteringGearbox ? 'Novo Modelo de Câmbio' : (selectedBrand ? 'Selecione o Modelo' : 'Selecione a Marca')}
                                  </p>
                                </div>
                                {selectedBrand && !isRegisteringGearbox && <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{selectedBrand}</span>}
                              </div>

                              {/* Form de Cadastro de Modelo (Câmbio) */}
                              {isRegisteringGearbox ? (
                                <form onSubmit={handleCreateGearbox} className="space-y-3 animate-in fade-in slide-in-from-right-4">
                                  <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo / Câmbio</label>
                                    <input required autoFocus className={inputClasses} value={newGearboxData.model} onChange={e => setNewGearboxData({ ...newGearboxData, model: e.target.value })} placeholder="Ex: DSG DQ200, AL4..." />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                                      <select className={inputClasses} value={newGearboxData.type} onChange={e => setNewGearboxData({ ...newGearboxData, type: e.target.value })}>
                                        <option value="MANUAL">MANUAL</option>
                                        <option value="AUTOMÁTICO">AUTOMÁTICO</option>
                                        <option value="CVT">CVT</option>
                                        <option value="AUTOMATIZADO">AUTOMATIZADO</option>
                                        <option value="DUPLA EMBREAGEM">DUPLA EMBREAGEM</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Marchas</label>
                                      <select className={inputClasses} value={newGearboxData.specs} onChange={e => setNewGearboxData({ ...newGearboxData, specs: e.target.value })}>
                                        <option value="">Selecione...</option>
                                        <option value="4 Marchas">4 Marchas</option>
                                        <option value="5 Marchas">5 Marchas</option>
                                        <option value="6 Marchas">6 Marchas</option>
                                      </select>
                                    </div>
                                    <div className="col-span-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempo Montagem</label>
                                      <select className={inputClasses} value={newGearboxData.assemblyTime} onChange={e => setNewGearboxData({ ...newGearboxData, assemblyTime: e.target.value })}>
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 10 }, (_, i) => {
                                          const minutes = (i + 1) * 30;
                                          const h = Math.floor(minutes / 60);
                                          const m = minutes % 60;
                                          const label = h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
                                          return <option key={i} value={label}>{label}</option>;
                                        })}
                                      </select>
                                    </div>
                                  </div>
                                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-xl mt-2 shadow-lg hover:bg-indigo-700 transition-all">Salvar e Selecionar</button>
                                </form>
                              ) : (
                                /* Listas de Seleção */
                                <>
                                  {!selectedBrand ? (
                                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                      {brands?.map(b => (
                                        <button key={b.id} onClick={() => setSelectedBrand(b.name)} className="p-3 border border-slate-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-center group">
                                          <span className="text-xs font-black text-slate-700 group-hover:text-indigo-700 uppercase">{b.name}</span>
                                        </button>
                                      ))}
                                      {(!brands || brands.length === 0) && <p className="col-span-2 text-center text-xs text-slate-400 py-4">Nenhuma marca cadastrada.</p>}
                                    </div>
                                  ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                      {/* Search Bar for Gearboxes */}
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                          type="text"
                                          placeholder="Buscar modelo..."
                                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                          value={gearboxSearch}
                                          onChange={(e) => setGearboxSearch(e.target.value)}
                                        />
                                      </div>

                                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                        <button onClick={() => setIsRegisteringGearbox(true)} className="w-full py-3 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">+ NOVO MODELO</button>

                                        {filteredGearboxes.map(g => (
                                          <button key={g.id} onClick={() => { setSelectedGearbox(g); setStep(2); setIsCreatingVehicle(true); }} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-left group">
                                            <div className="flex items-center gap-3">
                                              <Car className="w-5 h-5 text-slate-400" />
                                              <div>
                                                <p className="font-bold text-slate-900 text-xs uppercase group-hover:text-indigo-600">{g.model}</p>
                                                <p className="text-[9px] font-mono text-slate-400 uppercase">{g.specs}</p>
                                              </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                          </button>
                                        ))}

                                        {filteredGearboxes.length === 0 && gearboxSearch && (
                                          <p className="text-center text-[10px] text-slate-400 py-4 italic">Nenhum modelo encontrado.</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Serviço</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: VehicleCategory.PRIVATE, label: 'Particular', icon: UserCheck, color: 'text-slate-600' },
                      { id: VehicleCategory.COMPANY, label: 'Empresa / Frota', icon: Briefcase, color: 'text-indigo-600' },
                      { id: VehicleCategory.RESTORATION, label: 'Restauração / Premium', icon: Sparkles, color: 'text-amber-600' }
                    ].map(item => (
                      <button key={item.id} type="button" onClick={() => { setCategory(item.id); setStep(4); }} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left">
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                        <span className="text-[11px] font-black uppercase tracking-tight text-slate-900">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urgência do Atendimento</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: Priority.LOW, label: 'Baixa', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                      { id: Priority.MEDIUM, label: 'Média', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                      { id: Priority.HIGH, label: 'Alta / Crítica', color: 'bg-red-50 text-red-600 border-red-100' }
                    ].map(p => (
                      <button key={p.id} type="button" onClick={() => { setPriority(p.id); setStep(5); }} className={`p-4 rounded-xl border font-black text-[11px] uppercase tracking-widest text-left ${p.color} hover:shadow-md transition-all`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 5 && (
                <form onSubmit={handleSubmitOS} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sintomas / Defeito</label>
                    <textarea required placeholder="Descreva os sintomas relatados detalhadamente..." className="w-full h-40 p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-slate-900 font-medium" value={fault} onChange={(e) => setFault(e.target.value)}></textarea>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setStep(4)} className="flex-1 py-3 text-slate-400 font-black text-[10px] uppercase border border-slate-100 rounded-xl">Voltar</button>
                    <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-all">Finalizar Check-in</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewOSModal;
