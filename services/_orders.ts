import { WorkshopOrder, OrderItem, OrderHistory, OrderDocument } from '../types';
import { supabase, getNextId, mathRandomString } from './_client';
import { mapOrderFromDB, mapHistoryFromDB } from './_mappers';

export const fetchOrders = async (): Promise<WorkshopOrder[]> => {
    const { data: fullOrders, error: fullError } = await supabase
        .from('ordens_servico')
        .select(`
            *,
            itens_ordem (*),
            itens_checklist (*),
            order_documents (*)
        `);

    if (fullError) throw fullError;
    return fullOrders.map(o => mapOrderFromDB(o, o.itens_ordem, o.itens_checklist));
};

export const createOrder = async (order: WorkshopOrder): Promise<WorkshopOrder> => {
    const newId = await getNextId('ordens_servico');
    const { data: newOrder, error } = await supabase.from('ordens_servico').insert({
        id: newId,
        id_veiculo: order.vehicleId,
        status: order.status,
        prioridade: order.priority,
        categoria: order.category,
        quilometragem: order.km,
        nivel_combustivel: order.fuelLevel,
        defeito_relatado: order.reportedFault,
        data_agendamento: order.scheduledDate || null,
        duracao_estimada: order.estimatedDuration,
        desconto: order.discount,
        tipo_desconto: order.discountType,
        observacoes: order.notes,
        criado_em: order.createdAt
    }).select().single();

    if (error) throw error;
    return mapOrderFromDB(newOrder);
};

export const updateOrder = async (orderId: string, updates: Partial<WorkshopOrder>) => {
    const db: any = {};
    if (updates.vehicleId !== undefined) db.id_veiculo = updates.vehicleId;
    if (updates.status !== undefined) db.status = updates.status;
    if (updates.priority !== undefined) db.prioridade = updates.priority;
    if (updates.category !== undefined) db.categoria = updates.category;
    if (updates.km !== undefined) db.quilometragem = updates.km;
    if (updates.fuelLevel !== undefined) db.nivel_combustivel = updates.fuelLevel;
    if (updates.reportedFault !== undefined) db.defeito_relatado = updates.reportedFault;
    if (updates.diagnosis !== undefined) db.diagnostico = updates.diagnosis;
    if (updates.mechanicId !== undefined) db.id_mecanico = updates.mechanicId;
    if (updates.scheduledDate !== undefined) db.data_agendamento = updates.scheduledDate;
    if (updates.estimatedDuration !== undefined) db.duracao_estimada = updates.estimatedDuration;
    if (updates.discount !== undefined) db.desconto = updates.discount;
    if (updates.discountType !== undefined) db.tipo_desconto = updates.discountType;
    if (updates.notes !== undefined) db.observacoes = updates.notes;

    db.atualizado_em = new Date().toISOString();

    const { error } = await supabase.from('ordens_servico').update(db).eq('id', orderId);
    if (error) throw error;

    if (updates.checklist) {
        const { error: deleteError } = await supabase.from('itens_checklist').delete().eq('id_ordem', orderId);
        if (deleteError) throw deleteError;

        if (updates.checklist.length > 0) {
            const { error: insertError } = await supabase.from('itens_checklist').insert(
                updates.checklist.map(item => {
                    const dbItem: any = {
                        id_ordem: orderId,
                        rotulo: item.label,
                        marcado: item.checked
                    };
                    if (item.id && !item.id.startsWith('cl-')) {
                        dbItem.id = item.id;
                    }
                    return dbItem;
                })
            );
            if (insertError) throw insertError;
        }
    }
};

export const deleteOrder = async (id: string) => {
    await supabase.from('itens_ordem').delete().eq('id_ordem', id);
    await supabase.from('itens_checklist').delete().eq('id_ordem', id);
    await supabase.from('historico_ordem').delete().eq('id_ordem', id);
    await supabase.from('order_documents').delete().eq('order_id', id);
    const { error } = await supabase.from('ordens_servico').delete().eq('id', id);
    if (error) throw error;
};

export const addOrderItem = async (orderId: string, item: OrderItem): Promise<OrderItem> => {
    const newId = await getNextId('itens_ordem');
    const { data, error } = await supabase.from('itens_ordem').insert({
        id: newId,
        id_ordem: orderId,
        tipo: item.type,
        descricao: item.description,
        quantidade: item.quantity,
        preco: item.price,
        waiting_parts: item.waitingForParts,
        expected_arrival: item.expectedArrival
    }).select().single();

    if (error) throw error;

    return {
        id: data.id,
        type: data.tipo,
        description: data.descricao,
        quantity: Number(data.quantidade),
        price: Number(data.preco),
        waitingForParts: data.waiting_parts,
        expectedArrival: data.expected_arrival
    };
};

export const updateOrderItem = async (itemId: string, updates: { quantity: number; price?: number }) => {
    const { error } = await supabase.from('itens_ordem').update({
        quantidade: updates.quantity,
        ...(updates.price && { preco: updates.price })
    }).eq('id', itemId);
    if (error) throw error;
};

export const deleteOrderItem = async (itemId: string) => {
    const { error } = await supabase.from('itens_ordem').delete().eq('id', itemId);
    if (error) throw error;
};

export const fetchHistory = async (): Promise<OrderHistory[]> => {
    const { data, error } = await supabase.from('historico_ordem').select('*').order('data_hora', { ascending: false });
    if (error) throw error;
    return data.map(mapHistoryFromDB);
};

export const addHistory = async (log: OrderHistory) => {
    const { error } = await supabase.from('historico_ordem').insert({
        id: log.id,
        id_ordem: log.orderId,
        acao: log.action,
        diff: log.diff,
        data_hora: log.timestamp,
        id_usuario: null
    });
    if (error) throw error;
};

export const uploadDocument = async (orderId: string, file: File, customName?: string): Promise<{ data: OrderDocument | null; error?: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orderId}/${Date.now()}-${mathRandomString()}.${fileExt}`;

    const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

    if (storageError) {
        console.error('Error uploading file to storage:', storageError);
        return { data: null, error: `Storage Error: ${storageError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
    const newId = `doc-${Date.now()}-${mathRandomString()}`;

    const { data: docData, error: docError } = await supabase.from('order_documents').insert({
        id: newId,
        order_id: orderId,
        name: customName || file.name,
        url: publicUrl,
        type: fileExt?.toUpperCase() || 'FILE'
    }).select().single();

    if (docError) {
        console.error('Error inserting document metadata:', docError);
        return { data: null, error: `Database Error: ${docError.message}` };
    }

    return {
        data: {
            id: docData.id,
            orderId: docData.order_id,
            name: docData.name,
            url: docData.url,
            type: docData.type,
            createdAt: docData.created_at
        }
    };
};

export const deleteDocument = async (id: string, pathUrl: string) => {
    const { error: dbError } = await supabase.from('order_documents').delete().eq('id', id);
    if (dbError) throw dbError;
};
