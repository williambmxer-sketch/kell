
import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, CreditCard, Save } from 'lucide-react';
import { Client } from '../types';

interface ClientModalProps {
  client?: Client | null;
  onClose: () => void;
  onSave: (client: Client) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ client, onClose, onSave }) => {
  const [formData, setFormData] = useState<Client>({
    id: `c-${Date.now()}`,
    name: '',
    email: '',
    phone: '',
    cpf: ''
  });

  // Sincroniza o estado quando o cliente para edição é carregado
  useEffect(() => {
    if (client) {
      setFormData(client);
    }
  }, [client]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  /* Logic for CEP Autofill */
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleZipCodeBlur = async () => {
    const cep = formData.zipCode?.replace(/\D/g, '');
    if (cep && cep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
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

  // Cores de texto forçadas para slate-900 (preto acinzentado) para evitar letra branca em fundo claro
  const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 font-medium";
  const simpleInputClasses = "w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 font-medium";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 h-[90vh] md:h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              {client ? 'Editar Cadastro' : 'Novo Cliente'}
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Informações do Proprietário
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-all"><X className="w-4 h-4 text-slate-400" /></button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Conta</span>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase transition-colors ${(!formData.type || formData.type === 'PRIVATE') ? 'text-indigo-600' : 'text-slate-400'}`}>Particular</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: (prev.type === 'COMPANY' ? 'PRIVATE' : 'COMPANY') }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${formData.type === 'COMPANY' ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.type === 'COMPANY' ? 'left-[22px]' : 'left-0.5'}`}></div>
              </button>
              <span className={`text-[10px] font-black uppercase transition-colors ${formData.type === 'COMPANY' ? 'text-indigo-600' : 'text-slate-400'}`}>Empresa</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                required
                className={inputClasses}
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF / CNPJ</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  className={inputClasses}
                  value={formData.cpf}
                  onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  className={inputClasses}
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-3 block">Endereço Completo</label>

            <div className="grid grid-cols-[120px_1fr] gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                <input
                  className={simpleInputClasses}
                  value={formData.zipCode || ''}
                  onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                  onBlur={handleZipCodeBlur}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço</label>
                <input
                  className={simpleInputClasses}
                  value={formData.address || ''}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder={isLoadingCep ? 'Carregando...' : 'Rua...'}
                  disabled={isLoadingCep}
                />
              </div>
            </div>

            <div className="grid grid-cols-[80px_1fr] gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                <input
                  className={simpleInputClasses}
                  value={formData.addressNumber || ''}
                  onChange={e => setFormData({ ...formData, addressNumber: e.target.value })}
                  placeholder="123"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                <input
                  className={simpleInputClasses}
                  value={formData.neighborhood || ''}
                  onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Bairro"
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_60px] gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                <input
                  className={simpleInputClasses}
                  value={formData.city || ''}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">UF</label>
                <input
                  className={simpleInputClasses}
                  value={formData.state || ''}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 mt-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                className={inputClasses}
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              {client ? 'Atualizar Cliente' : 'Confirmar Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
