import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkshopContext } from '../App';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Send, Loader2, Download } from 'lucide-react';
import { emitNFe, getInvoicesByOrder } from '../services/fiscal';
import { WorkshopOrder, Client, Vehicle, FiscalInvoice } from '../types';
import { supabase } from '../services/supabase';

const InvoicePage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const context = useContext(WorkshopContext);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [logs, setLogs] = useState<string[]>([]);
    const [existingInvoice, setExistingInvoice] = useState<FiscalInvoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    if (!context) return null;
    const { orders, clients, vehicles, settings } = context;

    const order = orders.find(o => o.id === orderId);

    // Derived State
    const vehicle = order ? vehicles.find(v => v.id === order.vehicleId) : null;
    const client = vehicle ? clients.find(c => c.id === vehicle.clientId) : null;

    useEffect(() => {
        if (!order) {
            // setTimeout(() => navigate('/dashboard'), 3000); // Redirect if not found
        } else {
            // Fetch existing invoice
            const loadInvoice = async () => {
                try {
                    const invoices = await getInvoicesByOrder(order.id);
                    if (invoices && invoices.length > 0) {
                        setExistingInvoice(invoices[0]);
                        addLog(`Nota Fiscal encontrada: ${invoices[0].number || 'Processando'}`);
                    }
                } catch (err) {
                    console.error("Erro ao carregar notas", err);
                } finally {
                    setIsLoading(false);
                }
            };
            loadInvoice();
        }
    }, [order, navigate]);

    // If order is not found (and we assume context is loaded or we give a grace period)
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!order) {
            const timer = setTimeout(() => setNotFound(true), 2000); // Wait 2s to allow context to load
            return () => clearTimeout(timer);
        }
    }, [order]);

    if (!order || !client) {
        if (notFound) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                    <AlertTriangle className="w-12 h-12 text-amber-500/50" />
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Pedido não encontrado</h2>
                        <p className="text-sm">O pedido ou o cliente vinculado não existem neste banco de dados.</p>
                    </div>
                    <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold hover:bg-indigo-100 transition-colors">
                        Voltar ao Início
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Carregando dados da Nota Fiscal...</p>
            </div>
        );
    }

    const handleEmit = async () => {
        setIsSubmitting(true);
        setStatus('PROCESSING');
        addLog('Iniciando transmissão...');

        try {
            // Prepare Payload (Mock)
            const payload = {
                orderId: order.id,
                client: {
                    cpf: client.cpf,
                    name: client.name,
                    email: client.email
                },
                items: order.items,
                total: order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
            };

            addLog('Payload gerado com sucesso.');

            // Call Service
            await emitNFe(payload);

            setStatus('SUCCESS');
            addLog('Nota autorizada com sucesso! (Simulação)');
        } catch (error: any) {
            console.error(error);
            setStatus('ERROR');
            addLog(`Erro: ${error.message || 'Falha na comunicação'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            Emissão de NF-e (Modelo 55)
                        </h1>
                        <p className="text-xs text-slate-500 font-mono">Ref. OS #{order.id}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Status Feedback */}
                    {status !== 'IDLE' && (
                        <div className={`p-4 rounded-xl border ${status === 'SUCCESS' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                            status === 'ERROR' ? 'bg-red-50 border-red-200 text-red-800' :
                                'bg-blue-50 border-blue-200 text-blue-800'
                            }`}>
                            <h3 className="font-bold flex items-center gap-2">
                                {status === 'PROCESSING' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {status === 'SUCCESS' && <CheckCircle className="w-4 h-4" />}
                                {status === 'ERROR' && <AlertTriangle className="w-4 h-4" />}
                                {status === 'PROCESSING' ? 'Processando...' : status === 'SUCCESS' ? 'Nota Autorizada' : 'Erro na Emissão'}
                            </h3>
                            <div className="mt-2 text-xs font-mono bg-white/50 p-2 rounded max-h-32 overflow-auto">
                                {logs.map((log, i) => <div key={i}>{log}</div>)}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Emitter (Settings) */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Emitente</h3>
                            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                <p><strong className="text-slate-900 dark:text-slate-100">{settings?.nome_oficina || 'Oficina Master'}</strong></p>
                                <p>CNPJ: {settings?.cnpj || 'Não configurado'}</p>
                                <p>{settings?.endereco}, {settings?.numero}</p>
                                <p>{settings?.cidade} - {settings?.estado}</p>
                            </div>
                        </div>

                        {/* Recipient (Client) */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Destinatário</h3>
                            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                <p><strong className="text-slate-900 dark:text-slate-100">{client.name}</strong></p>
                                <p className="flex items-center gap-2">
                                    CPF/CNPJ: {client.cpf || 'Não informado'}
                                    {!client.cpf && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                </p>
                                <p>{client.address}, {client.addressNumber}</p>
                                <p>{client.city} - {client.state}</p>
                            </div>
                        </div>
                    </div>

                    {/* Products/Services */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Itens da Nota</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                                <tr>
                                    <th className="p-4 font-bold">Descrição</th>
                                    <th className="p-4 font-bold">Qtd</th>
                                    <th className="p-4 font-bold text-right">Valor Unit.</th>
                                    <th className="p-4 font-bold text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {order.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <td className="p-4 text-slate-900 dark:text-slate-100 font-medium">
                                            {item.description}
                                            {item.type === 'SERVICE' && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded">Serviço</span>}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 text-right">R$ {item.price.toFixed(2)}</td>
                                        <td className="p-4 text-slate-900 dark:text-slate-100 font-bold text-right">R$ {(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                                <tr>
                                    <td colSpan={3} className="p-4 text-right text-slate-500 uppercase text-xs tracking-widest">Total da Nota</td>
                                    <td className="p-4 text-right text-indigo-600 text-lg">
                                        R$ {order.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-4">
                        {existingInvoice ? (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => window.open(existingInvoice.pdfUrl || '#', '_blank')}
                                    disabled={!existingInvoice.pdfUrl}
                                    className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <FileText className="w-5 h-5" />
                                    Imprimir DANFE
                                </button>
                                <button
                                    onClick={() => window.open(existingInvoice.xmlUrl || '#', '_blank')}
                                    disabled={!existingInvoice.xmlUrl}
                                    className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <Download className="w-5 h-5" />
                                    XML
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleEmit}
                                disabled={isSubmitting || status === 'SUCCESS'}
                                className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg active:scale-95 ${isSubmitting || status === 'SUCCESS'
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-indigo-900/30'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processando...
                                    </>
                                ) : status === 'SUCCESS' ? (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Nota Emitida
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Transmitir NF-e
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InvoicePage;
