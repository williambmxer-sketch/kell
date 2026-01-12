
import React, { useContext, useState } from 'react';
import { WorkshopContext } from '../../App';
import { Plus, Trash2, UserCog, User, Shield, Wrench, Save, X, Check } from 'lucide-react';
import { User as UserType } from '../../types';

const TeamSettings: React.FC = () => {
    const context = useContext(WorkshopContext);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState<{ name: string; role: 'ADMIN' | 'MECHANIC' | 'ADVISOR' }>({ name: '', role: 'MECHANIC' });

    if (!context) return null;
    const { mechanics, addUser, updateUser, deleteUser } = context;

    const handleOpenAdd = () => {
        setEditingUser(null);
        setFormData({ name: '', role: 'MECHANIC' });
        setIsFormOpen(true);
    };

    const handleOpenEdit = (user: UserType) => {
        setEditingUser(user);
        setFormData({ name: user.name, role: user.role as any });
        setIsFormOpen(true);
    };

    const handleClose = () => {
        setIsFormOpen(false);
        setEditingUser(null);
        setFormData({ name: '', role: 'MECHANIC' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        if (editingUser) {
            await updateUser(editingUser.id, formData);
        } else {
            await addUser(formData);
        }
        handleClose();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este membro?')) {
            await deleteUser(id);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-indigo-500" /> Gestão da Equipe
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Gerencie os mecânicos e acessos ao sistema.</p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Novo Membro
                </button>
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                {editingUser ? (
                                    <><UserCog className="w-4 h-4 text-indigo-500" /> Editar Membro</>
                                ) : (
                                    <><Plus className="w-4 h-4 text-indigo-500" /> Novo Membro</>
                                )}
                            </h4>
                            <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Nome Completo</label>
                                <input
                                    autoFocus
                                    type="text"
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                    placeholder="Ex: João Silva"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">Função / Cargo</label>
                                <div className="grid grid-cols-1 gap-2">
                                    <select
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                    >
                                        <option value="MECHANIC">Mecânico / Técnico</option>
                                        <option value="ADVISOR">Consultor Técnico</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                    {formData.role === 'ADMIN' ? 'Acesso total a todas as configurações e financeiro.' :
                                        formData.role === 'ADVISOR' ? 'Acesso a clientes, orçamentos e agendamentos.' :
                                            'Acesso à fila de serviços e execução.'}
                                </p>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2.5 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 active:scale-95"
                                >
                                    <Save className="w-4 h-4" /> {editingUser ? 'Salvar Alterações' : 'Cadastrar Membro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Users List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mechanics.length > 0 ? (
                    mechanics.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => handleOpenEdit(user)}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                {/* Delete button isolated */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                                    className="bg-white text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg border border-slate-100 shadow-sm"
                                    title="Remover Membro"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg ${user.role === 'ADMIN' ? 'bg-slate-800 shadow-slate-100' :
                                            user.role === 'MECHANIC' ? 'bg-indigo-500 shadow-indigo-100' :
                                                'bg-emerald-500 shadow-emerald-100'
                                        }`}>
                                        {user.role === 'ADMIN' ? <Shield className="w-6 h-6" /> : user.role === 'MECHANIC' ? <Wrench className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-base">{user.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${user.role === 'ADMIN' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                    user.role === 'MECHANIC' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                {user.role === 'MECHANIC' ? 'Mecânico' : user.role === 'ADMIN' ? 'Admin' : 'Consultor'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                                <span>Clique para editar</span>
                                <UserCog className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <UserCog className="w-8 h-8" />
                        </div>
                        <h3 className="text-slate-900 font-bold mb-1">Nenhum membro encontrado</h3>
                        <p className="text-slate-500 text-sm mb-6">Comece adicionando sua equipe para gerenciar ordens de serviço.</p>
                        <button
                            onClick={handleOpenAdd}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-100"
                        >
                            <Plus className="w-4 h-4" /> Adicionar Primeiro Membro
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamSettings;
