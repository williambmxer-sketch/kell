
import React, { useContext, useState, useMemo } from 'react';
import { WorkshopContext } from '../App';
import { DollarSign, TrendingUp, TrendingDown, Clock, Download, Filter, Plus, X, Calendar, Tag } from 'lucide-react';
import { Transaction } from '../types';

const Finance: React.FC = () => {
  const context = useContext(WorkshopContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Date Filter State
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  if (!context) return null;
  const { transactions, orders, addTransaction, deleteTransaction } = context;

  // Filter Transactions by Date Range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const tDate = t.date.split('T')[0]; // Normalize to YYYY-MM-DD
      return tDate >= startDate && tDate <= endDate;
    });
  }, [transactions, startDate, endDate]);

  const combinedList = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate Stats based on FILTERED transactions (as per user request "verificar o faturamento no periodo selecionado")
  const stats = useMemo(() => {
    const pendingIn = filteredTransactions.filter(t => t.type === 'IN' && t.status === 'PENDING').reduce((acc, t) => acc + t.amount, 0);
    const pendingOut = filteredTransactions.filter(t => t.type === 'OUT' && t.status === 'PENDING').reduce((acc, t) => acc + t.amount, 0);

    const realizedIn = filteredTransactions.filter(t => t.type === 'IN' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
    const realizedOut = filteredTransactions.filter(t => t.type === 'OUT' && t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0);
    const flow = realizedIn - realizedOut;

    return [
      { label: 'A Receber (Período)', value: `R$ ${pendingIn.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'A Pagar (Período)', value: `R$ ${pendingOut.toFixed(2)}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
      { label: 'Fluxo (Período)', value: `R$ ${flow.toFixed(2)}`, icon: DollarSign, color: flow >= 0 ? 'text-indigo-600' : 'text-red-600', bg: flow >= 0 ? 'bg-indigo-50' : 'bg-red-50' },
      { label: 'Total Transações', value: filteredTransactions.length.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];
  }, [filteredTransactions]);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Módulo Financeiro</h2>
          <p className="text-slate-500 text-sm">Controle de receitas, despesas e fluxo de caixa.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-bold text-slate-600 bg-transparent border-none outline-none focus:ring-0"
            />
            <span className="text-slate-300 font-bold">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-bold text-slate-600 bg-transparent border-none outline-none focus:ring-0"
            />
            <div className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-widest border-l border-slate-100 pl-2">
              Filtro
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-hover hover:shadow-md">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-bold text-slate-800">Movimentações</h3>
          <div className="flex gap-2">
            {/* Future filters */}
          </div>
        </div>
        <div className="overflow-x-auto">
          {combinedList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium">Nenhuma movimentação no período selecionado.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Data</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Descrição</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Categoria</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right">Valor</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {combinedList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {row.description}
                      {row.orderId && <span className="ml-2 text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">Auto</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs uppercase tracking-wide">{row.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${row.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        row.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                        {row.status === 'PAID' ? 'Pago / Recebido' : 'Pendente'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-black text-right ${row.type === 'IN' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {row.type === 'IN' ? '+' : '-'} R$ {row.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setTransactionToDelete(row.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors text-xs font-bold uppercase"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-500 text-sm mb-6">
              Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTransactionToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (transactionToDelete) deleteTransaction(transactionToDelete);
                  setTransactionToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold text-sm shadow-sm transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <TransactionModal onClose={() => setIsModalOpen(false)} onSave={addTransaction} />
      )}
    </div>
  );
};

interface TransactionModalProps {
  onClose: () => void;
  onSave: (t: Transaction) => Promise<void>;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    description: '',
    category: 'Geral',
    amount: '',
    type: 'OUT' as 'IN' | 'OUT',
    status: 'PAID' as 'PENDING' | 'PAID',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction: Transaction = {
      id: crypto.randomUUID(), // Temp ID, DB will likely ignore or use it
      ...formData,
      amount: Number(formData.amount)
    };
    await onSave(newTransaction);
    onClose();
  };

  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Novo Lançamento</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </header>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Descrição</label>
            <input required className={inputClass} placeholder="Ex: Aluguel, Peças, Serviço X..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Valor (R$)</label>
              <input required type="number" step="0.01" className={inputClass} placeholder="0.00" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Data</label>
              <input required type="date" className={inputClass} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Tipo</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button type="button" onClick={() => setFormData({ ...formData, type: 'IN' })} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase ${formData.type === 'IN' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Entrada</button>
                <button type="button" onClick={() => setFormData({ ...formData, type: 'OUT' })} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase ${formData.type === 'OUT' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Saída</button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Status</label>
              <select className={inputClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                <option value="PAID">Pago / Recebido</option>
                <option value="PENDING">Pendente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Categoria</label>
            <input className={inputClass} placeholder="Ex: Fixo, Variável, Peças..." value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
          </div>

          <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all mt-4">
            Salvar Lançamento
          </button>
        </form>
      </div>
    </div>
  );
};

export default Finance;
