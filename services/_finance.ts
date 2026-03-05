import { Transaction, Brand, PaymentMethod } from '../types';
import { supabase, getNextId, getUserId } from './_client';
import { mapTransactionFromDB, mapBrandFromDB, mapPaymentMethodFromDB } from './_mappers';

// TRANSACTIONS
export const fetchTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase.from('transacoes').select('*').order('data', { ascending: false });
    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
    return data.map(mapTransactionFromDB);
};

export const createTransaction = async (transaction: Transaction): Promise<Transaction> => {
    const newId = await getNextId('transacoes');
    const { data, error } = await supabase.from('transacoes').insert({
        id: newId,
        descricao: transaction.description,
        categoria: transaction.category,
        valor: transaction.amount,
        tipo: transaction.type,
        status: transaction.status,
        data: transaction.date,
        id_ordem: transaction.orderId,
        forma_pagamento: transaction.paymentMethod
    }).select().single();
    if (error) throw error;
    return mapTransactionFromDB(data);
};

export const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transacoes').delete().eq('id', id);
    if (error) throw error;
};

// BRANDS
export const fetchBrands = async (): Promise<Brand[]> => {
    const { data, error } = await supabase.from('marcas').select('*').order('nome');
    if (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
    return data.map(mapBrandFromDB);
};

export const createBrand = async (brand: Brand): Promise<Brand> => {
    const newId = await getNextId('marcas');
    const user_id = await getUserId();
    const { data, error } = await supabase.from('marcas').insert({
        id: newId,
        user_id,
        nome: brand.name,
        logo_url: brand.logo
    }).select().single();
    if (error) throw error;
    return mapBrandFromDB(data);
};

export const deleteBrand = async (id: string) => {
    const { error } = await supabase.from('marcas').delete().eq('id', id);
    if (error) throw error;
};

// PAYMENT METHODS
export const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
    const { data, error } = await supabase.from('formas_pagamento').select('*').order('name');
    if (error) {
        console.error('Error fetching payment methods:', error);
        return [];
    }
    return data.map(mapPaymentMethodFromDB);
};

export const createPaymentMethod = async (name: string): Promise<PaymentMethod> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase.from('formas_pagamento').insert({
        name,
        active: true,
        user_id: user.id
    }).select().single();
    if (error) throw error;
    return mapPaymentMethodFromDB(data);
};

export const togglePaymentMethod = async (id: string, active: boolean) => {
    const { error } = await supabase.from('formas_pagamento').update({ active }).eq('id', id);
    if (error) throw error;
};

export const deletePaymentMethod = async (id: string) => {
    const { error } = await supabase.from('formas_pagamento').delete().eq('id', id);
    if (error) throw error;
};
