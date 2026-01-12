import React from 'react';
import { X, Printer } from 'lucide-react';
import { WorkshopOrder, Gearbox, Vehicle } from '../../types';

interface GearboxReportProps {
    orders: WorkshopOrder[];
    vehicles: Vehicle[];
    gearboxes: Gearbox[]; // Optional, maybe for validating names?
    filters: {
        month: string; // YYYY-MM
        brand: string;
        search: string;
    };
    onClose: () => void;
}

const GearboxReport: React.FC<GearboxReportProps> = ({ orders, vehicles, filters, onClose }) => {
    // 1. Filter Orders by Date and Status
    const [year, month] = filters.month ? filters.month.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];

    const relevantOrders = orders.filter(o => {
        if (o.status !== 'FINISHED') return false;
        if (!o.createdAt) return false;
        const orderDate = new Date(o.createdAt);
        return orderDate.getFullYear() === year && (orderDate.getMonth() + 1) === month;
    });

    // 2. Aggregate Data
    const stats: Record<string, { brand: string, model: string, count: number }> = {};
    let totalCount = 0;

    relevantOrders.forEach(order => {
        const vehicle = vehicles.find(v => v.id === order.vehicleId);
        if (!vehicle) return;

        // Apply Brand Filter
        if (filters.brand && vehicle.brand !== filters.brand) return;

        // Apply Search Filter (Model or Code matches)
        // Note: We don't have explicit gearbox code on vehicle, so we search vehicle model/brand
        if (filters.search) {
            const search = filters.search.toLowerCase();
            const text = `${vehicle.brand} ${vehicle.model}`.toLowerCase();
            if (!text.includes(search)) return;
        }

        const key = `${vehicle.brand}-${vehicle.model}`;
        if (!stats[key]) {
            stats[key] = { brand: vehicle.brand, model: vehicle.model, count: 0 };
        }
        stats[key].count++;
        totalCount++;
    });

    const reportRows = Object.values(stats).sort((a, b) => b.count - a.count);

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-200">
            {/* HEADER (No-Print) */}
            <div className="flex items-center justify-between px-8 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
                <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Relatório de Produção de Câmbios</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors"
                    >
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* REPORT CONTENT (Printable) */}
            <div className="flex-1 overflow-auto p-8 print:p-0">
                <div className="max-w-4xl mx-auto bg-white print:max-w-none">

                    {/* Report Header */}
                    <div className="mb-8 border-b-2 border-slate-900 pb-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Relatório de Câmbios</h1>
                                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                                    Período: {month.toString().padStart(2, '0')}/{year}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros Aplicados</div>
                                <div className="text-xs font-bold text-slate-700 uppercase">
                                    {filters.brand || 'Todas as Marcas'}
                                    {filters.search ? ` • ${filters.search}` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">#</th>
                                <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marca</th>
                                <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Modelo Veículo/Câmbio</th>
                                <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qtd. Produzida</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reportRows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-400 text-sm italic">
                                        Nenhum registro encontrado para este período.
                                    </td>
                                </tr>
                            ) : (
                                reportRows.map((row, index) => (
                                    <tr key={index}>
                                        <td className="py-3 text-xs font-bold text-slate-400">{index + 1}</td>
                                        <td className="py-3 text-xs font-bold text-slate-700 uppercase">{row.brand}</td>
                                        <td className="py-3 text-xs font-medium text-slate-600 uppercase">{row.model}</td>
                                        <td className="py-3 text-xs font-black text-slate-900 text-right">{row.count}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                            Gerado em {new Date().toLocaleString('pt-BR')}
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Total Geral</span>
                            <span className="text-xl font-black text-slate-900">{totalCount}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default GearboxReport;
