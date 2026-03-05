import { Client, Vehicle } from '../types';
import { supabase, getNextId } from './_client';
import { mapClientFromDB, mapVehicleFromDB } from './_mappers';

export const fetchClients = async (): Promise<Client[]> => {
    const { data, error } = await supabase.from('clientes').select('*');
    if (error) throw error;
    return data.map(mapClientFromDB);
};

export const createClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
    const id = await getNextId('clientes');
    const { data, error } = await supabase.from('clientes').insert({
        id,
        nome: client.name,
        email: client.email,
        telefone: client.phone,
        cpf: client.cpf,
        endereco: client.address,
        numero_endereco: client.addressNumber,
        cidade: client.city,
        cep: client.zipCode,
        bairro: client.neighborhood,
        estado: client.state
    }).select().single();

    if (error) throw error;
    return mapClientFromDB(data);
};

export const updateClient = async (id: string, updates: Partial<Client>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.nome = updates.name;
    if (updates.email) dbUpdates.email = updates.email;
    if (updates.phone) dbUpdates.telefone = updates.phone;
    if (updates.cpf) dbUpdates.cpf = updates.cpf;
    if (updates.address) dbUpdates.endereco = updates.address;
    if (updates.addressNumber) dbUpdates.numero_endereco = updates.addressNumber;
    if (updates.city) dbUpdates.cidade = updates.city;
    if (updates.zipCode) dbUpdates.cep = updates.zipCode;
    if (updates.neighborhood) dbUpdates.bairro = updates.neighborhood;
    if (updates.state) dbUpdates.estado = updates.state;

    const { error } = await supabase.from('clientes').update(dbUpdates).eq('id', id);
    if (error) throw error;
};

export const deleteClient = async (id: string) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
};

export const fetchVehicles = async (): Promise<Vehicle[]> => {
    const { data, error } = await supabase.from('veiculos').select('*');
    if (error) throw error;
    return data.map(mapVehicleFromDB);
};

export const createVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    const id = await getNextId('veiculos');
    const { data, error } = await supabase.from('veiculos').insert({
        id,
        id_cliente: vehicle.clientId,
        placa: vehicle.plate,
        modelo: vehicle.model,
        marca: vehicle.brand,
        ano: vehicle.year,
        cor: vehicle.color
    }).select().single();

    if (error) throw error;
    return mapVehicleFromDB(data);
};

export const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    const db: any = {};
    if (updates.clientId) db.id_cliente = updates.clientId;
    if (updates.plate) db.placa = updates.plate;
    if (updates.model) db.modelo = updates.model;
    if (updates.brand) db.marca = updates.brand;
    if (updates.year) db.ano = updates.year;
    if (updates.color) db.cor = updates.color;

    const { error } = await supabase.from('veiculos').update(db).eq('id', id);
    if (error) throw error;
};

export const deleteVehicle = async (id: string) => {
    const { error } = await supabase.from('veiculos').delete().eq('id', id);
    if (error) throw error;
};
