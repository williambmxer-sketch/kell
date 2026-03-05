import { useState } from 'react';
import { toast } from 'sonner';
import { WorkshopOrder, OSStatus, OrderHistory } from '../types';
import {
    fetchOrders as fetchOrdersService,
    createOrder as createOrderService,
    updateOrder as updateOrderService,
    deleteOrder as deleteOrderService,
    fetchHistory as fetchHistoryService,
    addHistory as addHistoryService
} from '../services/supabase';
import { STATUS_CONFIG } from '../constants';

export function useOrders() {
    const [orders, setOrders] = useState<WorkshopOrder[]>([]);
    const [history, setHistory] = useState<OrderHistory[]>([]);

    const load = async () => {
        const [ordersData, historyData] = await Promise.all([
            fetchOrdersService(),
            fetchHistoryService()
        ]);
        setOrders(ordersData);
        setHistory(historyData);
    };

    const addHistoryLog = async (orderId: string, action: string, diff?: string) => {
        const newLog: OrderHistory = {
            id: crypto.randomUUID(),
            orderId,
            action,
            diff,
            timestamp: new Date().toISOString(),
            userId: 'admin-01'
        };
        setHistory(prev => [newLog, ...prev]);
        try {
            await addHistoryService(newLog);
        } catch (err) {
            console.error('Failed to add history log', err);
        }
    };

    const createAuditLog = (orderId: string, oldData: WorkshopOrder, newData: Partial<WorkshopOrder>) => {
        const changes: string[] = [];
        const ignoreKeys = ['updatedAt', 'status', 'mechanicId', 'scheduledDate', 'documents', 'items'];

        (Object.keys(newData) as Array<keyof WorkshopOrder>).forEach(key => {
            if (ignoreKeys.includes(key)) return;
            const oldVal = oldData[key];
            const newVal = newData[key];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                if (key === 'diagnosis') {
                    // Handled by specific log in OSDetailsModal
                } else if (key === 'discount') {
                    const val = typeof newVal === 'number' ? newVal : 0;
                    changes.push(`Alterou o desconto para ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                } else if (key === 'discountType') {
                    changes.push(`Alterou tipo de desconto para ${newVal === 'percent' ? '%' : 'R$'}`);
                } else if (key === 'notes') {
                    changes.push('Atualizou observações do orçamento');
                } else {
                    changes.push(`Alterou ${key}`);
                }
            }
        });

        if (changes.length > 0) {
            addHistoryLog(orderId, 'Alteração de dados', changes.join(' | '));
        }
    };

    const updateOrderStatus = async (orderId: string, status: OSStatus) => {
        const order = orders.find(o => o.id === orderId);
        if (order && order.status !== status) {
            addHistoryLog(orderId, 'Mudança de Status', `Alterado para ${STATUS_CONFIG[status]?.label || status}`);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o));
            try {
                await updateOrderService(orderId, { status });
            } catch (err) {
                console.error('Failed to update status', err);
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: order.status } : o));
                toast.error('Erro ao atualizar status da OS.');
            }
        }
    };

    const updateOrder = async (orderId: string, data: Partial<WorkshopOrder>) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        createAuditLog(orderId, order, data);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...data, updatedAt: new Date().toISOString() } : o));
        try {
            await updateOrderService(orderId, data);
        } catch (err) {
            console.error('Failed to update order', err);
            toast.error('Erro ao salvar alterações na OS.');
        }
    };

    const addNewOrder = async (order: WorkshopOrder) => {
        setOrders(prev => [order, ...prev]);
        try {
            const newOrder = await createOrderService(order);
            setOrders(prev => prev.map(o => o.id === order.id ? newOrder : o));
            toast.success('OS criada com sucesso!');
            return newOrder;
        } catch (err) {
            console.error('Failed to create order', err);
            setOrders(prev => prev.filter(o => o.id !== order.id));
            toast.error('Erro ao criar OS. Tente novamente.');
        }
    };

    const deleteOrder = async (id: string) => {
        const backup = orders;
        setOrders(prev => prev.filter(o => o.id !== id));
        try {
            await deleteOrderService(id);
            toast.success('OS excluída com sucesso.');
        } catch (err) {
            console.error('Failed to delete order', err);
            setOrders(backup);
            toast.error('Erro ao excluir OS.');
        }
    };

    return {
        orders, setOrders,
        history, setHistory,
        load,
        addHistoryLog,
        updateOrderStatus,
        updateOrder,
        addNewOrder,
        deleteOrder
    };
}
