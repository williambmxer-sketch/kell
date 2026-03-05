import { InventoryItem, Service, Gearbox } from '../types';
import { supabase, getNextId, getUserId } from './_client';
import { mapInventoryItemFromDB, mapServiceFromDB, mapGearboxFromDB } from './_mappers';

// INVENTORY
export const fetchInventory = async (): Promise<InventoryItem[]> => {
    const { data, error } = await supabase.from('itens_estoque').select('*');
    if (error) throw error;
    return data.map(mapInventoryItemFromDB);
};

export const createInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const id = await getNextId('itens_estoque');
    const code = id;
    const { data, error } = await supabase.from('itens_estoque').insert({
        id,
        codigo: code,
        nome: item.name,
        fornecedor: item.supplier,
        preco_custo: item.costPrice,
        preco_venda: item.salePrice,
        estoque: item.stock,
        estoque_minimo: item.minStock
    }).select().single();
    if (error) throw error;
    return mapInventoryItemFromDB(data);
};

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    const db: any = {};
    if (updates.code) db.codigo = updates.code;
    if (updates.name) db.nome = updates.name;
    if (updates.supplier) db.fornecedor = updates.supplier;
    if (updates.costPrice) db.preco_custo = updates.costPrice;
    if (updates.salePrice) db.preco_venda = updates.salePrice;
    if (updates.stock !== undefined) db.estoque = updates.stock;
    if (updates.minStock !== undefined) db.estoque_minimo = updates.minStock;

    const { error } = await supabase.from('itens_estoque').update(db).eq('id', id);
    if (error) throw error;
};

export const deleteInventoryItem = async (id: string) => {
    const { error } = await supabase.from('itens_estoque').delete().eq('id', id);
    if (error) throw error;
};

// SERVICES
export const fetchServices = async (): Promise<Service[]> => {
    const { data, error } = await supabase.from('servicos').select('*');
    if (error) throw error;
    return data.map(mapServiceFromDB);
};

export const createService = async (service: Service): Promise<Service> => {
    const newId = await getNextId('servicos');
    const user_id = await getUserId();
    const code = newId;
    const { data, error } = await supabase.from('servicos').insert({
        id: newId,
        user_id,
        codigo: code,
        nome: service.name,
        categoria: service.category,
        preco: service.price,
        tempo: service.time
    }).select().single();
    if (error) throw error;
    return mapServiceFromDB(data);
};

export const updateService = async (id: string, updates: Partial<Service>) => {
    const db: any = {};
    if (updates.code) db.codigo = updates.code;
    if (updates.name) db.nome = updates.name;
    if (updates.category) db.categoria = updates.category;
    if (updates.price) db.preco = updates.price;
    if (updates.time) db.tempo = updates.time;
    const { error } = await supabase.from('servicos').update(db).eq('id', id);
    if (error) throw error;
};

export const deleteService = async (id: string) => {
    const { error } = await supabase.from('servicos').delete().eq('id', id);
    if (error) throw error;
};

// GEARBOXES
export const fetchGearboxes = async (): Promise<Gearbox[]> => {
    const { data, error } = await supabase.from('cambios').select('*').order('marca', { ascending: true });
    if (error) {
        console.error('Error fetching gearboxes:', error);
        return [];
    }
    return data.map(mapGearboxFromDB);
};

export const createGearbox = async (engine: Gearbox): Promise<Gearbox> => {
    const newId = await getNextId('cambios');
    const { data, error } = await supabase.from('cambios').insert({
        id: newId,
        codigo: engine.code,
        modelo: engine.model,
        marca: engine.brand,
        tipo: engine.type,
        specs: engine.specs,
        tempo_montagem: engine.assemblyTime
    }).select().single();
    if (error) throw error;
    return mapGearboxFromDB(data);
};

export const updateGearbox = async (id: string, engine: Gearbox) => {
    const { error } = await supabase.from('cambios').update({
        codigo: engine.code,
        modelo: engine.model,
        marca: engine.brand,
        tipo: engine.type,
        specs: engine.specs,
        tempo_montagem: engine.assemblyTime
    }).eq('id', id);
    if (error) throw error;
};

export const deleteGearbox = async (id: string) => {
    const { error } = await supabase.from('cambios').delete().eq('id', id);
    if (error) throw error;
};
