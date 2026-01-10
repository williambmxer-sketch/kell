import React, { useContext, useState, useMemo, useEffect } from 'react';
import { WorkshopContext } from '../App';
import { OSStatus, Priority, VehicleCategory, Client, Vehicle, WorkshopOrder } from '../types';
import { X, Search, Car, User, Plus, ChevronRight, Briefcase, Sparkles, UserCheck, ChevronLeft, ToggleLeft, ToggleRight } from 'lucide-react';

interface NewOSModalProps {
  onClose: () => void;
}

const NewOSModal: React.FC<NewOSModalProps> = ({ onClose }) => {
  const context = useContext(WorkshopContext);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // New States for Flow Refactor
  const [serviceType, setServiceType] = useState<'PRIVATE' | 'COMPANY'>('PRIVATE');
  const [isRestoration, setIsRestoration] = useState(false);
  const [showAllClients, setShowAllClients] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  // ... other states ...
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedGearbox, setSelectedGearbox] = useState<import('../types').Gearbox | null>(null);
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState({ plate: '', color: '', year: new Date().getFullYear().toString(), model: '' });

  const [clientSearch, setClientSearch] = useState('');
  const [gearboxSearch, setGearboxSearch] = useState('');
  const [isRegisteringClient, setIsRegisteringClient] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client> & { type: 'PRIVATE' | 'COMPANY' }>({
    name: '', phone: '', cpf: '', email: '', zipCode: '', address: '', addressNumber: '', neighborhood: '', city: '', state: '', type: 'PRIVATE'
  });
  const [fault, setFault] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const [isRegisteringGearbox, setIsRegisteringGearbox] = useState(false);
  const [newGearboxData, setNewGearboxData] = useState({ model: '', type: 'MANUAL', specs: '5 Marchas', assemblyTime: '' });

  // New Brand Logic
  const [isRegisteringBrand, setIsRegisteringBrand] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  // Conflict State
  const [conflictData, setConflictData] = useState<{ vehicle: Vehicle, client: Client } | null>(null);

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
    if (conflictData) {
      setConflictData(null);
      return;
    }
    if (isRegisteringClient) {
      setIsRegisteringClient(false);
      return;
    }
    if (isRegisteringGearbox) {
      setIsRegisteringGearbox(false);
      return;
    }
    onClose();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCloseInternal(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, isRegisteringClient, isRegisteringGearbox, isRegisteringBrand]);

  if (!context) return null;

  const { addClient, addVehicle, addNewOrder, vehicles, clients, addHistoryLog, brands, addGearbox } = context;

  const useExistingVehicle = () => {
    if (!conflictData) return;

    // Switch Everything to existing
    setSelectedClient(conflictData.client);
    setSelectedVehicle(conflictData.vehicle);

    // Ensure service type matches client type (optional but good for consistency)
    if (conflictData.client.type) {
      setServiceType(conflictData.client.type);
    }

    setConflictData(null);
    setStep(4); // Skip to Priority
  };

  const filteredClients = useMemo(() => {
    let list = clients;

    // Filter by Service Type (unless Show All is verified)
    if (!showAllClients) {
      list = list.filter(c => c.type === serviceType || (!c.type && serviceType === 'PRIVATE')); // Default legacy clients to PRIVATE if undefined
    }

    if (!clientSearch) return list;
    return list.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.cpf.includes(clientSearch));
  }, [clients, clientSearch, serviceType, showAllClients]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = `c-${Date.now()}`;
      // Ensure type is set
      const clientData: Client = { ...newClient, id } as Client;

      const createdClient = await addClient(clientData);
      if (createdClient) {
        setSelectedClient(createdClient);
        setIsRegisteringClient(false);
        setStep(3); // Go to Vehicle
      } else {
        alert("Erro ao cadastrar cliente.");
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
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar modelo de câmbio.");
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    try {
      const newBrand: import('../types').Brand = {
        id: `b-${Date.now()}`,
        name: newBrandName.trim().toUpperCase(),
        logo: '' // Optional or placeholder
      };

      await context.addBrand(newBrand);
      setSelectedBrand(newBrand.name);
      setIsRegisteringBrand(false);
      setNewBrandName('');
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar marca.");
    }
  };

  const filteredBrands = useMemo(() => {
    if (!context.brands) return [];
    if (!brandSearch) return context.brands;
    return context.brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));
  }, [context.brands, brandSearch]);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedGearbox) return;

    // Validation & Duplication Check
    const cleanPlate = newVehicleData.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // Import helper inline or assume we can move it to top if strictly needed, but better to fetch from context or define here? 
    // Since I cannot modify top-level easily without huge context, I will include validation logic here or rely on the proposed file import.
    // Let's use the explicit checks here to be safe and robust without relying on a new import that might break if file isn't found by bundler immediately.

    // Regex Check
    const isOld = /^[A-Z]{3}\d{4}$/.test(cleanPlate);
    const isMercosur = /^[A-Z]{3}\d[A-Z]\d{2}$/.test(cleanPlate);

    if (!isOld && !isMercosur) {
      alert("Formato de placa inválido. Use ABC-1234 ou ABC1C34.");
      return;
    }

    // Duplicate Check
    const existingVehicle = context.vehicles.find(v => v.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanPlate);

    if (existingVehicle) {
      const existingClient = context.clients.find(c => c.id === existingVehicle.clientId);
      if (existingClient) {
        setConflictData({ vehicle: existingVehicle, client: existingClient });
      } else {
        alert("Esta placa já está cadastrada, mas o cliente não foi encontrado.");
      }
      return;
    }

    try {
      const newVehicle: Vehicle = {
        id: `v-${Date.now()}`,
        clientId: selectedClient.id,
        brand: selectedGearbox.brand,
        model: newVehicleData.model || selectedGearbox.model,
        plate: cleanPlate, // Store cleaned/standardized
        color: newVehicleData.color.toUpperCase(),
        year: parseInt(newVehicleData.year) || new Date().getFullYear()
      };

      const createdVehicle = await addVehicle(newVehicle);
      if (createdVehicle) {
        setSelectedVehicle(createdVehicle);
        setStep(4); // Go to Priority
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
    setStep(4); // Go to Priority
  };

  const parseDuration = (timeStr?: string): number => {
    if (!timeStr) return 0;
    let totalMinutes = 0;
    const hoursMatch = timeStr.match(/(\d+)h/);
    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
    const minMatch = timeStr.match(/(\d+)min/);
    if (minMatch) totalMinutes += parseInt(minMatch[1]);
    return totalMinutes;
  }

  const handleSubmitOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      let estimatedDuration = 0;
      if (selectedVehicle) {
        const gearbox = context.gearboxes.find(g => g.brand === selectedVehicle.brand && g.model === selectedVehicle.model);
        if (gearbox && gearbox.assemblyTime) {
          estimatedDuration = parseDuration(gearbox.assemblyTime);
        }
      }

      // Determine Category Logic
      let finalCategory = VehicleCategory.PRIVATE;
      if (isRestoration) finalCategory = VehicleCategory.RESTORATION;
      else if (serviceType === 'COMPANY') finalCategory = VehicleCategory.COMPANY;
      else finalCategory = VehicleCategory.PRIVATE;

      const newOrder: WorkshopOrder = {
        id: `OS-${Math.floor(100 + Math.random() * 900)}`,
        vehicleId: selectedVehicle.id,
        status: OSStatus.BUDGET,
        priority,
        category: finalCategory,
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
        await addHistoryLog(result.id, 'Abertura de OS', `Recepcionado direto em Orçamento. Relato: ${fault} | Tipo: ${finalCategory} | Prioridade: ${priority}`);
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
                  else if (step === 3) { // Vehicle Step Back Logic
                    if (selectedGearbox) setSelectedGearbox(null);
                    else if (isRegisteringBrand) setIsRegisteringBrand(false);
                    else if (selectedBrand) setSelectedBrand('');
                    else if (isCreatingVehicle) setIsCreatingVehicle(false);
                    else setStep(2);
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
          {/* STEP 1: SERVICE TYPE */}
          {step === 1 && (
            <div className="p-6 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Serviço</label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  <button
                    onClick={() => setServiceType('PRIVATE')}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${serviceType === 'PRIVATE' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${serviceType === 'PRIVATE' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-black uppercase ${serviceType === 'PRIVATE' ? 'text-indigo-900' : 'text-slate-700'}`}>Particular</h3>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Veículos de uso pessoal e clientes diretos</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setServiceType('COMPANY')}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${serviceType === 'COMPANY' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${serviceType === 'COMPANY' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-black uppercase ${serviceType === 'COMPANY' ? 'text-indigo-900' : 'text-slate-700'}`}>Empresa / Frota</h3>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Veículos corporativos e frotas parceiras</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div onClick={() => setIsRestoration(!isRestoration)} className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-colors ${isRestoration ? 'bg-amber-500 border-amber-600 text-white' : 'bg-white border-amber-200'}`}>
                  {isRestoration && <Sparkles className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => setIsRestoration(!isRestoration)}>
                  <h4 className="text-xs font-black text-amber-800 uppercase">Projeto de Restauração / Premium</h4>
                  <p className="text-[10px] text-amber-600/80 font-medium">Marque esta opção para serviços de alta complexidade</p>
                </div>
              </div>

              <button onClick={() => setStep(2)} className="w-full py-3.5 bg-indigo-600 text-white font-black text-xs uppercase rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: CLIENT SELECTION */}
          {step === 2 && (
            isRegisteringClient ? (
              <form onSubmit={handleCreateClient} className="p-6 space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Conta</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase transition-colors ${newClient.type === 'PRIVATE' ? 'text-indigo-600' : 'text-slate-400'}`}>Particular</span>
                      <button
                        type="button"
                        onClick={() => setNewClient(prev => ({ ...prev, type: prev.type === 'PRIVATE' ? 'COMPANY' : 'PRIVATE' }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${newClient.type === 'COMPANY' ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${newClient.type === 'COMPANY' ? 'left-[22px]' : 'left-0.5'}`}></div>
                      </button>
                      <span className={`text-[10px] font-black uppercase transition-colors ${newClient.type === 'COMPANY' ? 'text-indigo-600' : 'text-slate-400'}`}>Empresa</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input required className={inputClasses} value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Nome do cliente" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF/CNPJ</label>
                    <input required className={inputClasses} value={newClient.cpf} onChange={e => setNewClient({ ...newClient, cpf: e.target.value })} placeholder="Documento" />
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

                  {/* ... other address fields (Number, Neighborhood, City, State) ... */}
                  <div className="grid grid-cols-[80px_1fr] gap-3 mb-3">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label><input className={inputClasses} value={newClient.addressNumber || ''} onChange={e => setNewClient({ ...newClient, addressNumber: e.target.value })} placeholder="123" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label><input className={inputClasses} value={newClient.neighborhood || ''} onChange={e => setNewClient({ ...newClient, neighborhood: e.target.value })} placeholder="Bairro" /></div>
                  </div>
                  <div className="grid grid-cols-[1fr_60px] gap-3">
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label><input className={inputClasses} value={newClient.city || ''} onChange={e => setNewClient({ ...newClient, city: e.target.value })} placeholder="Cidade" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">UF</label><input className={inputClasses} value={newClient.state || ''} onChange={e => setNewClient({ ...newClient, state: e.target.value })} placeholder="UF" maxLength={2} /></div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsRegisteringClient(false)} className="flex-1 py-3 text-slate-400 font-black text-[10px] uppercase border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                  <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-xl">Confirmar e Seguir</button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {serviceType === 'PRIVATE' ? 'Clientes Particulares' : 'Clientes Empresariais'}
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Mostrar Todos</span>
                    <button onClick={() => setShowAllClients(!showAllClients)} className={`relative w-9 h-5 rounded-full transition-colors ${showAllClients ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${showAllClients ? 'left-[18px]' : 'left-0.5'}`}></div>
                    </button>
                  </label>
                </div>

                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Buscar cliente..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} /></div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  <button onClick={() => { setNewClient(prev => ({ ...prev, type: serviceType })); setIsRegisteringClient(true); }} className="w-full py-3 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">+ NOVO CLIENTE</button>
                  {filteredClients.map(c => (
                    <button key={c.id} onClick={() => { setSelectedClient(c); setStep(3); }} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-left group">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.type === 'COMPANY' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                          {c.type === 'COMPANY' ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs uppercase group-hover:text-indigo-600">{c.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{c.cpf}</p>
                            {c.type === 'COMPANY' && <span className="text-[8px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Empresa</span>}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  ))}
                  {filteredClients.length === 0 && <p className="text-center text-xs text-slate-400 py-8 italic">Nenhum cliente encontrado.</p>}
                </div>
              </div>
            )
          )}

          {/* STEP 3: VEHICLE SELECTION */}
          {step === 3 && selectedClient && (
            <div className="p-6">
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
                /* VEHICLE CREATION FLOW */
                <div className="space-y-4">
                  {(isCreatingVehicle || clientVehicles.length === 0) && (
                    <>
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
                        /* BRAND / GEARBOX SELECTION */
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              {isRegisteringGearbox && <button onClick={() => setIsRegisteringGearbox(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft className="w-4 h-4" /></button>}
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {isRegisteringGearbox ? 'Novo Modelo de Câmbio' : (selectedBrand ? 'Selecione o Modelo' : 'Selecione a Marca')}
                              </p>
                            </div>
                            {selectedBrand && !isRegisteringGearbox && <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{selectedBrand}</span>}
                          </div>

                          {isRegisteringGearbox ? (
                            <form onSubmit={handleCreateGearbox} className="space-y-3 animate-in fade-in slide-in-from-right-4">
                              <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo / Câmbio</label><input required autoFocus className={inputClasses} value={newGearboxData.model} onChange={e => setNewGearboxData({ ...newGearboxData, model: e.target.value })} placeholder="Ex: DSG DQ200, AL4..." /></div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                                  <select className={inputClasses} value={newGearboxData.type} onChange={e => setNewGearboxData({ ...newGearboxData, type: e.target.value })}>
                                    <option value="MANUAL">MANUAL</option><option value="AUTOMÁTICO">AUTOMÁTICO</option><option value="CVT">CVT</option><option value="AUTOMATIZADO">AUTOMATIZADO</option><option value="DUPLA EMBREAGEM">DUPLA EMBREAGEM</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Marchas</label>
                                  <select className={inputClasses} value={newGearboxData.specs} onChange={e => setNewGearboxData({ ...newGearboxData, specs: e.target.value })}>
                                    <option value="">Selecione...</option><option value="4 Marchas">4 Marchas</option><option value="5 Marchas">5 Marchas</option><option value="6 Marchas">6 Marchas</option>
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
                            <>
                              {!selectedBrand ? (
                                <>
                                  {isRegisteringBrand ? (
                                    <form onSubmit={handleCreateBrand} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <button type="button" onClick={() => setIsRegisteringBrand(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Marca</p>
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Marca</label>
                                        <input required autoFocus className={inputClasses} value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Ex: VOLKSWAGEN, FORD..." />
                                      </div>
                                      <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-black text-[10px] uppercase rounded-xl mt-2 shadow-lg hover:bg-indigo-700 transition-all">Salvar Marca</button>
                                    </form>
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Buscar marca..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs" value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} /></div>

                                      <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                                        <button onClick={() => setIsRegisteringBrand(true)} className="p-3 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 col-span-2">
                                          <Plus className="w-3 h-3" /> NOVA MARCA
                                        </button>
                                        {filteredBrands?.map(b => (
                                          <button key={b.id} onClick={() => setSelectedBrand(b.name)} className="p-3 border border-slate-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-center group">
                                            <span className="text-xs font-black text-slate-700 group-hover:text-indigo-700 uppercase">{b.name}</span>
                                          </button>
                                        ))}
                                        {filteredBrands?.length === 0 && <p className="text-center text-xs text-slate-400 py-4 italic col-span-2">Nenhuma marca encontrada.</p>}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Buscar modelo..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs" value={gearboxSearch} onChange={(e) => setGearboxSearch(e.target.value)} /></div>
                                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    <button onClick={() => setIsRegisteringGearbox(true)} className="w-full py-3 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">+ NOVO MODELO</button>
                                    {filteredGearboxes.map(g => (
                                      <button key={g.id} onClick={() => { setSelectedGearbox(g); setIsCreatingVehicle(true); }} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-left group">
                                        <div className="flex items-center gap-3">
                                          <Car className="w-5 h-5 text-slate-400" />
                                          <div><p className="font-bold text-slate-900 text-xs uppercase group-hover:text-indigo-600">{g.model}</p><p className="text-[9px] font-mono text-slate-400 uppercase">{g.specs}</p></div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: PRIORITY */}
          {step === 4 && (
            <div className="p-6 space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urgência do Atendimento</label>
              <div className="grid grid-cols-1 gap-2">
                {[{ id: Priority.LOW, label: 'Baixa', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' }, { id: Priority.MEDIUM, label: 'Média', color: 'bg-amber-50 text-amber-600 border-amber-100' }, { id: Priority.HIGH, label: 'Alta / Crítica', color: 'bg-red-50 text-red-600 border-red-100' }].map(p => (
                  <button key={p.id} type="button" onClick={() => { setPriority(p.id); setStep(5); }} className={`p-4 rounded-xl border font-black text-[11px] uppercase tracking-widest text-left ${p.color} hover:shadow-md transition-all`}>{p.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: FAULT DESCRIPTION */}
          {step === 5 && (
            <form onSubmit={handleSubmitOS} className="p-6 space-y-4">
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
      </div>

      {/* Duplicate Vehicle Conflict Modal */}
      {conflictData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-1 text-amber-600">
                <Car className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 uppercase">Veículo já Cadastrado</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  A placa <span className="text-slate-900 font-black font-mono bg-slate-100 px-1.5 py-0.5 rounded">{conflictData.vehicle.plate}</span> já pertence à frota de outro cliente.
                </p>
              </div>

              <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Proprietário Atual</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">{conflictData.client.name}</p>
                    <p className="text-[10px] text-slate-500">{conflictData.client.phone}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full pt-2">
                <button
                  onClick={useExistingVehicle}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Usar este Veículo e Cliente
                </button>
                <button
                  onClick={() => setConflictData(null)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors"
                >
                  Corrigir Placa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOSModal;
