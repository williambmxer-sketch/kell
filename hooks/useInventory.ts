import { useState } from 'react';
import { toast } from 'sonner';
import { InventoryItem, Service, Gearbox, Brand } from '../types';
import {
    fetchInventory as fetchInventoryService,
    createInventoryItem as createInventoryItemService,
    updateInventoryItem as updateInventoryItemService,
    deleteInventoryItem as deleteInventoryItemService,
    fetchServices as fetchServicesService,
    createService as createServiceService,
    updateService as updateServiceService,
    deleteService as deleteServiceService,
    fetchGearboxes as fetchGearboxesService,
    createGearbox as createGearboxService,
    updateGearbox as updateGearboxService,
    deleteGearbox as deleteGearboxService,
    fetchBrands as fetchBrandsService,
    createBrand as createBrandService,
    deleteBrand as deleteBrandService
} from '../services/supabase';

export function useInventory() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [gearboxes, setGearboxes] = useState<Gearbox[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    const load = async () => {
        const [inventoryData, servicesData, enginesData, brandsData] = await Promise.all([
            fetchInventoryService(),
            fetchServicesService(),
            fetchGearboxesService(),
            fetchBrandsService()
        ]);
        setInventory(inventoryData);
        setServices(servicesData);
        setGearboxes(enginesData);
        setBrands(brandsData);
    };

    // Inventory
    const addInventoryItem = async (item: InventoryItem) => {
        try {
            const newItem = await createInventoryItemService(item);
            setInventory(prev => [...prev, newItem]);
        } catch (err) {
            console.error('Failed to add inventory', err);
            toast.error('Erro ao adicionar item ao estoque.');
        }
    };

    const updateInventoryItem = async (id: string, item: InventoryItem) => {
        setInventory(prev => prev.map(i => i.id === id ? item : i));
        await updateInventoryItemService(id, item);
    };

    const deleteInventoryItem = async (id: string) => {
        setInventory(prev => prev.filter(i => i.id !== id));
        await deleteInventoryItemService(id);
    };

    // Services
    const addService = async (service: Service) => {
        setServices(prev => [...prev, service]);
        await createServiceService(service);
    };

    const updateService = async (id: string, service: Service) => {
        setServices(prev => prev.map(s => s.id === id ? service : s));
        await updateServiceService(id, service);
    };

    const deleteService = async (id: string) => {
        setServices(prev => prev.filter(s => s.id !== id));
        await deleteServiceService(id);
    };

    // Gearboxes
    const addGearbox = async (gearbox: Gearbox) => {
        try {
            const newGearbox = await createGearboxService(gearbox);
            setGearboxes(prev => [...prev, newGearbox]);
        } catch (err) {
            console.error('Failed to add gearbox', err);
            toast.error('Erro ao adicionar câmbio.');
        }
    };

    const updateGearbox = async (id: string, gearbox: Gearbox) => {
        setGearboxes(prev => prev.map(e => e.id === id ? gearbox : e));
        await updateGearboxService(id, gearbox);
    };

    const deleteGearbox = async (id: string) => {
        setGearboxes(prev => prev.filter(e => e.id !== id));
        await deleteGearboxService(id);
    };

    // Brands
    const addBrand = async (brand: Brand) => {
        setBrands(prev => [...prev, brand]);
        await createBrandService(brand);
    };

    const deleteBrand = async (id: string) => {
        setBrands(prev => prev.filter(b => b.id !== id));
        await deleteBrandService(id);
    };

    return {
        inventory, setInventory,
        services, setServices,
        gearboxes, setGearboxes,
        brands, setBrands,
        load,
        addInventoryItem, updateInventoryItem, deleteInventoryItem,
        addService, updateService, deleteService,
        addGearbox, updateGearbox, deleteGearbox,
        addBrand, deleteBrand
    };
}
