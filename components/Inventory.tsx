
import React, { useContext, useState } from 'react';
import { WorkshopContext } from '../App';
import { Search, AlertTriangle, Package, TrendingUp, Plus, Settings2, Cpu, Trash2, Edit3, X, Save, Clock } from 'lucide-react';
import { InventoryItem, Service, Gearbox } from '../types';

const Inventory: React.FC = () => {
  const context = useContext(WorkshopContext);
  const [activeTab, setActiveTab] = useState<'parts' | 'services' | 'gearboxes' | 'brands'>('parts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  // CRUD states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  if (!context) return null;
  const {
    inventory, gearboxes, services, brands,
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    addService, updateService, deleteService,
    addGearbox, updateGearbox, deleteGearbox,
    addBrand, deleteBrand
  } = context;

  const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.code.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredGearboxes = gearboxes.filter(e => {
    const matchesSearch = e.model.toLowerCase().includes(searchTerm.toLowerCase()) || e.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand ? e.brand === selectedBrand : true;
    return matchesSearch && matchesBrand;
  });
  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const stats = [
    { label: 'Peças em Estoque', value: inventory.reduce((acc, i) => acc + i.stock, 0), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Abaixo do Mínimo', value: inventory.filter(i => i.stock < i.minStock).length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Marcas Cadastradas', value: brands.length, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Câmbios em Base', value: gearboxes.length, icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const performDelete = () => {
    if (!itemToDelete) return;
    if (activeTab === 'parts') deleteInventoryItem(itemToDelete);
    else if (activeTab === 'services') deleteService(itemToDelete);
    else if (activeTab === 'gearboxes') deleteGearbox(itemToDelete);
    else if (activeTab === 'brands') deleteBrand(itemToDelete);
    setItemToDelete(null);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/50">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Catálogo Mestre</h2>
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest text-[10px]">Gestão técnica de componentes, câmbios e marcas.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Filtrar ${activeTab === 'parts' ? 'peças' : activeTab === 'services' ? 'serviços' : activeTab === 'gearboxes' ? 'câmbios' : 'marcas'}...`}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-bold text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {activeTab === 'gearboxes' && (
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-bold text-slate-700 uppercase"
            >
              <option value="">Todas as Marcas</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Novo Registro
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className={`p-3 rounded-xl ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-lg font-black text-slate-900 leading-none mt-1 uppercase tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="flex border-b border-slate-100 bg-slate-50/30 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('parts'); setSearchTerm(''); }}
            className={`px-8 py-4 text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-widest border-b-2 shrink-0 ${activeTab === 'parts' ? 'bg-white text-indigo-600 border-indigo-600' : 'text-slate-400 hover:text-slate-600 border-transparent'
              }`}
          >
            <Package className="w-3.5 h-3.5" /> Peças
          </button>
          <button
            onClick={() => { setActiveTab('gearboxes'); setSearchTerm(''); }}
            className={`px-8 py-4 text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-widest border-b-2 shrink-0 ${activeTab === 'gearboxes' ? 'bg-white text-indigo-600 border-indigo-600' : 'text-slate-400 hover:text-slate-600 border-transparent'
              }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Câmbios
          </button>
          <button
            onClick={() => { setActiveTab('brands'); setSearchTerm(''); }}
            className={`px-8 py-4 text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-widest border-b-2 shrink-0 ${activeTab === 'brands' ? 'bg-white text-indigo-600 border-indigo-600' : 'text-slate-400 hover:text-slate-600 border-transparent'
              }`}
          >
            <Settings2 className="w-3.5 h-3.5" /> Marcas
          </button>
          <button
            onClick={() => { setActiveTab('services'); setSearchTerm(''); }}
            className={`px-8 py-4 text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-widest border-b-2 shrink-0 ${activeTab === 'services' ? 'bg-white text-indigo-600 border-indigo-600' : 'text-slate-400 hover:text-slate-600 border-transparent'
              }`}
          >
            <Settings2 className="w-3.5 h-3.5" /> Serviços
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'parts' && (
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-2/5">Item / Referência</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Saldo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Preço Venda</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-700 uppercase group-hover:text-indigo-600 transition-colors">{item.name}</div>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-slate-300 bg-slate-100 px-1 rounded">#{item.id}</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">{item.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">{item.supplier}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-black ${item.stock < item.minStock ? 'text-red-600' : 'text-slate-700'}`}>{item.stock}</span>
                      <span className="text-[9px] text-slate-400 ml-1 font-bold">/ {item.minStock}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-indigo-600 font-black text-right font-mono tracking-tighter">R$ {item.salePrice.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'brands' && (
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Marca</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBrands.map(brand => (
                  <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-700 uppercase">{brand.name}</span>
                      <span className="ml-2 text-[9px] font-black text-slate-300 bg-slate-100 px-1 rounded">#{brand.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleDelete(brand.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'gearboxes' && (
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Cód. Câmbio</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marca</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Modelo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Montagem</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGearboxes.map(gearbox => (
                  <tr key={gearbox.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-indigo-600 uppercase font-mono tracking-widest">{gearbox.code}</div>
                      <span className="text-[9px] font-black text-slate-300 bg-slate-100 px-1 rounded block w-fit mt-1">#{gearbox.id}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">{gearbox.brand}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">{gearbox.model}</td>
                    <td className="px-6 py-4"><span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded border border-amber-200 uppercase tracking-widest">{gearbox.assemblyTime || '-'}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(gearbox)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(gearbox.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'services' && (
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-2/5">Serviço / Especialidade</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor MO</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map(service => (
                  <tr key={service.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-700 uppercase group-hover:text-indigo-600 transition-colors">{service.name}</div>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-slate-300 bg-slate-100 px-1 rounded">#{service.id}</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">{service.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">{service.category}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-bold uppercase">{service.time}</td>
                    <td className="px-6 py-4 text-xs text-emerald-600 font-black text-right font-mono tracking-tighter">R$ {service.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(service)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(service.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <InventoryModal
          type={activeTab}
          item={editingItem}
          onClose={() => setIsModalOpen(false)}
          context={{
            addInventoryItem, updateInventoryItem,
            addService, updateService,
            addGearbox, updateGearbox,
            addBrand, brands
          }}
        />
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setItemToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-1">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">Excluir Registro?</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <button
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
                  onClick={() => setItemToDelete(null)}
                >
                  Cancelar
                </button>
                <button
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-red-100"
                  onClick={performDelete}
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface InventoryModalProps {
  type: 'parts' | 'services' | 'gearboxes' | 'brands';
  item?: any;
  onClose: () => void;
  context: any;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ type, item, onClose, context }) => {
  const [formData, setFormData] = useState<any>(item || {
    id: `i-${Date.now()}`,
    code: '',
    name: '',
    supplier: '',
    costPrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 0,
    category: '',
    time: '',
    price: 0,
    brand: '',
    model: '',
    assemblyTime: ''
  });

  // Effect to generate code for NEW gearboxes
  React.useEffect(() => {
    if (type === 'gearboxes' && !item) {
      const existingCodes = context.gearboxes?.map((g: any) => g.code) || [];
      const numbers = existingCodes
        .map((c: string) => parseInt(c.replace('AUTO-', '')))
        .filter((n: number) => !isNaN(n));

      const max = numbers.length > 0 ? Math.max(...numbers) : 0;
      const next = max + 1;
      const formatted = `AUTO-${next.toString().padStart(4, '0')}`;

      setFormData((prev: any) => ({ ...prev, code: formatted }));
    }
  }, [type, item, context.gearboxes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'parts') {
      item ? context.updateInventoryItem(item.id, formData) : context.addInventoryItem(formData);
    } else if (type === 'services') {
      item ? context.updateService(item.id, formData) : context.addService(formData);
    } else if (type === 'gearboxes') {
      item ? context.updateGearbox(item.id, formData) : context.addGearbox(formData);
    } else if (type === 'brands') {
      item ? null : context.addBrand(formData);
    }
    onClose();
  };

  const inputClasses = "w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{item ? 'Editar' : 'Novo'} {type === 'parts' ? 'Peça' : type === 'services' ? 'Serviço' : type === 'gearboxes' ? 'Câmbio' : 'Marca'}</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gestão de Catálogo</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
        </header>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {type === 'brands' && (
            <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Marca</label><input required className={inputClasses} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
          )}

          {type !== 'brands' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Código / Ref</label>
                <input
                  required={type === 'gearboxes'} // Only required for gearboxes now vs optional/auto
                  className={`${inputClasses} ${type !== 'brands' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                  value={type === 'gearboxes' ? formData.code : 'Automático'}
                  onChange={e => type === 'gearboxes' && setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  readOnly={true} // Always read-only as per request (auto-generated or auto-filled)
                />
              </div>
              <div className="col-span-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{type === 'gearboxes' ? 'Marca' : type === 'services' ? 'Categoria' : 'Fornecedor'}</label>
                {type === 'gearboxes' ? (
                  <select required className={inputClasses} value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}>
                    <option value="">Selecione...</option>
                    {context.brands?.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                ) : (
                  <input required className={inputClasses} value={type === 'services' ? formData.category : formData.supplier} onChange={e => setFormData({ ...formData, [type === 'services' ? 'category' : 'supplier']: e.target.value })} />
                )}
              </div>
            </div>
          )}

          {type !== 'brands' && (
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{type === 'parts' ? 'Descrição da Peça' : type === 'services' ? 'Nome do Serviço' : 'Modelo do Câmbio'}</label>
              <input required className={inputClasses} value={type === 'parts' ? formData.name : type === 'services' ? formData.name : formData.model} onChange={e => setFormData({ ...formData, [type === 'gearboxes' ? 'model' : 'name']: e.target.value })} />
            </div>
          )}

          {type === 'parts' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Custo (R$)</label><input type="number" step="0.01" className={inputClasses} value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })} /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Venda (R$)</label><input type="number" step="0.01" className={inputClasses} value={formData.salePrice} onChange={e => setFormData({ ...formData, salePrice: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estoque Atual</label><input type="number" className={inputClasses} value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estoque Mínimo</label><input type="number" className={inputClasses} value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} /></div>
              </div>
            </>
          )}

          {type === 'services' && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempo Médio</label><div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" /><input placeholder="1h 30min" className={`${inputClasses} pl-8`} value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} /></div></div>
              <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Mão de Obra</label><input type="number" step="0.01" className={inputClasses} value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} /></div>
            </div>
          )}

          {type === 'gearboxes' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Configuração (Tipo)</label>
                  <select className={inputClasses} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="">Selecione...</option>
                    <option value="MANUAL">MANUAL</option>
                    <option value="AUTOMÁTICO">AUTOMÁTICO</option>
                    <option value="CVT">CVT</option>
                    <option value="AUTOMATIZADO">AUTOMATIZADO</option>
                    <option value="DUPLA EMBREAGEM">DUPLA EMBREAGEM</option>
                  </select>
                </div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempo Montagem</label>
                  <select className={inputClasses} value={formData.assemblyTime} onChange={e => setFormData({ ...formData, assemblyTime: e.target.value })}>
                    <option value="">Selecione...</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const minutes = (i + 1) * 30;
                      const h = Math.floor(minutes / 60);
                      const m = minutes % 60;
                      const label = h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
                      // Storing simpler format for parsing, or just the label since types say string?
                      // Let's store the Label to be user friendly, but we need to parse it later.
                      // Or store "HH:MM"?
                      // User asked for "1h, hasta 5h".
                      return <option key={i} value={label}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4">
            <Save className="w-4 h-4" /> Salvar Registro
          </button>
        </form>
      </div>
    </div>
  );
};

export default Inventory;
