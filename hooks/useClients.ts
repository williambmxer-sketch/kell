import { useState } from 'react';
import { toast } from 'sonner';
import { Client, Vehicle } from '../types';
import {
    createClient as createClientService,
    updateClient as updateClientService,
    deleteClient as deleteClientService,
    fetchClients as fetchClientsService,
    createVehicle as createVehicleService,
    updateVehicle as updateVehicleService,
    deleteVehicle as deleteVehicleService,
    fetchVehicles as fetchVehiclesService
} from '../services/supabase';

export function useClients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const load = async () => {
        const [clientsData, vehiclesData] = await Promise.all([
            fetchClientsService(),
            fetchVehiclesService()
        ]);
        setClients(clientsData);
        setVehicles(vehiclesData);
    };

    const addClient = async (client: Client) => {
        try {
            const newClient = await createClientService(client);
            setClients(prev => [...prev, newClient]);
            toast.success('Cliente cadastrado com sucesso!');
            return newClient;
        } catch (err) {
            console.error('Failed to add client', err);
            toast.error('Erro ao cadastrar cliente.');
        }
    };

    const updateClient = async (id: string, data: Partial<Client>) => {
        setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
        try {
            await updateClientService(id, data);
        } catch (err) {
            console.error('Failed to update client', err);
            toast.error('Erro ao atualizar cliente.');
        }
    };

    const deleteClient = async (id: string) => {
        const backup = clients;
        setClients(prev => prev.filter(c => c.id !== id));
        try {
            await deleteClientService(id);
            toast.success('Cliente removido.');
        } catch (err) {
            console.error('Failed to delete client', err);
            setClients(backup);
            toast.error('Erro ao remover cliente.');
        }
    };

    const addVehicle = async (vehicle: Vehicle) => {
        try {
            const newVehicle = await createVehicleService(vehicle);
            setVehicles(prev => [...prev, newVehicle]);
            return newVehicle;
        } catch (err) {
            console.error('Failed to add vehicle', err);
            toast.error('Erro ao cadastrar veículo.');
        }
    };

    const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
        setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
        try {
            await updateVehicleService(id, data);
        } catch (err) {
            console.error('Failed to update vehicle', err);
            toast.error('Erro ao atualizar veículo.');
        }
    };

    const deleteVehicle = async (id: string) => {
        const backup = vehicles;
        setVehicles(prev => prev.filter(item => item.id !== id));
        try {
            await deleteVehicleService(id);
        } catch (err) {
            console.error('Failed to delete vehicle', err);
            setVehicles(backup);
            toast.error('Erro ao remover veículo.');
        }
    };

    return {
        clients, setClients,
        vehicles, setVehicles,
        load,
        addClient, updateClient, deleteClient,
        addVehicle, updateVehicle, deleteVehicle
    };
}
