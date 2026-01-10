
import React, { useState, useEffect, useContext } from 'react';
import { X, Car, Tag, Calendar, Palette, Save, History, FileText, Wrench, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Vehicle } from '../types';
import { WorkshopContext } from '../App';
import { STATUS_CONFIG } from '../constants';

interface VehicleModalProps {
  clientId: string;
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
}

const VehicleModal: React.FC<VehicleModalProps> = ({ clientId, vehicle, onClose, onSave }) => {
  const context = useContext(WorkshopContext);
  const [formData, setFormData] = useState<Vehicle>({
    id: vehicle?.id || `v-${Date.now()}`,
    clientId: clientId,
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    plate: vehicle?.plate || '',
    year: vehicle?.year || new Date().getFullYear()
  });

  const vehicleOrders = context?.orders.filter(o => o.vehicleId === vehicle?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Alert Modal State
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation & Duplication Check logic
    const cleanPlate = formData.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // Regex Check
    const isOld = /^[A-Z]{3}\d{4}$/.test(cleanPlate);
    const isMercosur = /^[A-Z]{3}\d[A-Z]\d{2}$/.test(cleanPlate);

    if (!isOld && !isMercosur) {
      setAlertModal({
        isOpen: true,
        title: 'Placa Inválida',
        message: 'O formato da placa está incorreto.\nUse o padrão ABC-1234 (Antigo) ou ABC1C34 (Mercosul).',
        type: 'error'
      });
      return;
    }

    // Duplicate Check 
    // We must ensure context exists
    if (context) {
      const plateExists = context.vehicles.some(v =>
        v.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanPlate &&
        v.id !== formData.id // Ensure strict exclusion of current vehicle based on formData ID
      );

      if (plateExists) {
        setAlertModal({
          isOpen: true,
          title: 'Veículo Duplicado',
          message: 'Esta placa já está cadastrada em outro veículo da base de dados.',
          type: 'error'
        });
        return;
      }
    }

    // Save with standardized plate
    onSave({ ...formData, plate: cleanPlate });
  };

  const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 font-medium uppercase";

  return (
    <>
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {vehicle ? 'Editar Veículo e Histórico' : 'Vincular Veículo'}
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                Frota do Cliente
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-all"><X className="w-4 h-4 text-slate-400" /></button>
          </header>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Form Section */}
            <div className="p-6 md:w-1/3 border-r border-slate-100 overflow-y-auto custom-scrollbar shrink-0">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Car className="w-4 h-4 text-indigo-600" /> Dados do Veículo
              </h4>
              <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required className={inputClasses} value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Ex: Honda" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input required className={inputClasses} value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="Ex: Civic" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa / Serial</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">PLK</div>
                    <input required className={`${inputClasses} pl-11 font-mono font-bold tracking-widest`} value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value })} placeholder="ABC-1234" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ano</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="number" required className={inputClasses} value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} placeholder="2024" />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* History Section */}
            <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto custom-scrollbar">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" /> Histórico de Serviços ({vehicleOrders.length})
              </h4>

              {vehicleOrders.length > 0 ? (
                <div className="space-y-4">
                  {vehicleOrders.map(order => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-all">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest">OS #{order.id}</span>
                          <span className="text-[10px] font-bold text-slate-400">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${STATUS_CONFIG[order.status].color}`}>
                          {STATUS_CONFIG[order.status].label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <FileText className="w-3 h-3" /> Relato do Cliente (Defeito)
                          </div>
                          <p className="text-xs text-slate-600 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                            "{order.reportedFault}"
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <Wrench className="w-3 h-3" /> Diagnóstico Técnico
                          </div>
                          {order.diagnosis ? (
                            <p className="text-xs text-slate-800 font-medium bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 leading-relaxed text-indigo-900">
                              {order.diagnosis}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic py-2">Pendente...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-60 min-h-[200px]">
                  <FileText className="w-12 h-12 stroke-1" />
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhum histórico encontrado</p>
                </div>
              )}
            </div>
          </div >

          <div className="p-4 bg-white border-t border-slate-100 shrink-0 flex justify-end">
            <button
              type="submit"
              form="vehicle-form"
              className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Veículo
            </button>
          </div>
        </div >
      </div >

      {/* Custom Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setAlertModal({ ...alertModal, isOpen: false })}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1 ${alertModal.type === 'error' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                {alertModal.type === 'error' ? <AlertCircle className="w-6 h-6 text-red-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 uppercase">{alertModal.title}</h3>
                <p className="text-sm text-slate-500 font-medium whitespace-pre-wrap">
                  {alertModal.message}
                </p>
              </div>
              <button
                className={`w-full py-3 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg active:scale-95 ${alertModal.type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}
                onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VehicleModal;
