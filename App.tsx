
import React, { useState, useMemo, useEffect } from 'react';
import { useBranding } from './hooks/useBranding';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import Clients from './components/Clients';
import Inventory from './components/Inventory';
import Finance from './components/Finance';
import Settings from './components/Settings';
import Login from './components/Login';
import { STATUS_CONFIG } from './constants';
import {
  fetchOrders, fetchClients, fetchVehicles, fetchInventory, fetchServices, fetchUsers, fetchHistory as fetchHistoryService, addHistory as addHistoryService,
  createClient as createClientService, updateClient as updateClientService, createVehicle as createVehicleService, updateVehicle as updateVehicleService, deleteVehicle as deleteVehicleService,
  createOrder as createOrderService, updateOrder as updateOrderService, deleteOrder as deleteOrderService,
  createInventoryItem as createInventoryItemService, updateInventoryItem as updateInventoryItemService, deleteInventoryItem as deleteInventoryItemService,
  createService as createServiceService, updateService as updateServiceService, deleteService as deleteServiceService,
  deleteClient as deleteClientService, fetchTransactions as fetchTransactionsService, createTransaction as createTransactionService, deleteTransaction as deleteTransactionService,
  fetchGearboxes as fetchGearboxesService, createGearbox as createGearboxService, updateGearbox as updateGearboxService, deleteGearbox as deleteGearboxService,
  fetchSettings as fetchSettingsService, updateSettings as updateSettingsService,
  createUser as createUserService, updateUser as updateUserService, deleteUser as deleteUserService,
  fetchBrands as fetchBrandsService, createBrand as createBrandService, deleteBrand as deleteBrandService,
  supabase, getSession
} from './services/supabase';
import { WorkshopOrder, Client, Vehicle, InventoryItem, OSStatus, OrderHistory, Gearbox, Service, User, Transaction, WorkshopSettings, Brand } from './types';

export const WorkshopContext = React.createContext<{
  orders: WorkshopOrder[];
  clients: Client[];
  vehicles: Vehicle[];
  inventory: InventoryItem[];
  gearboxes: Gearbox[];
  services: Service[];
  mechanics: User[];
  history: OrderHistory[];
  transactions: Transaction[];
  settings: WorkshopSettings | null;
  brands: Brand[];
  setOrders: React.Dispatch<React.SetStateAction<WorkshopOrder[]>>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  setGearboxes: React.Dispatch<React.SetStateAction<Gearbox[]>>;
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setSettings: React.Dispatch<React.SetStateAction<WorkshopSettings | null>>;
  setBrands: React.Dispatch<React.SetStateAction<Brand[]>>;
  updateOrderStatus: (orderId: string, status: OSStatus) => Promise<void>;
  updateOrder: (orderId: string, data: Partial<WorkshopOrder>) => Promise<void>;
  addHistoryLog: (orderId: string, action: string, diff?: string) => Promise<void>;
  addClient: (client: Client) => Promise<Client | undefined>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addVehicle: (vehicle: Vehicle) => Promise<Vehicle | undefined>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addGearbox: (gearbox: Gearbox) => Promise<void>;
  updateGearbox: (id: string, gearbox: Gearbox) => Promise<void>;
  deleteGearbox: (id: string) => Promise<void>;
  addBrand: (brand: Brand) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  addService: (service: Service) => Promise<void>;
  updateService: (id: string, service: Service) => void;
  deleteService: (id: string) => void;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryItem: (id: string, item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addNewOrder: (order: WorkshopOrder) => Promise<WorkshopOrder | undefined>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
} | null>(null);

const App: React.FC = () => {
  const [orders, setOrders] = useState<WorkshopOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gearboxes, setGearboxes] = useState<Gearbox[]>([]);
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);

  useBranding(settings);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = checking, false = not auth, true = auth

  // Check Auth Session on Mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        setIsAuthenticated(!!session);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkSession();

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [ordersData, clientsData, vehiclesData, inventoryData, servicesData, usersData, historyData, transactionsData, enginesData, settingsData, brandsData] = await Promise.all([
          fetchOrders(),
          fetchClients(),
          fetchVehicles(),
          fetchInventory(),
          fetchServices(),
          fetchUsers(),
          fetchHistoryService(),
          fetchTransactionsService(),
          fetchGearboxesService(),
          fetchSettingsService(),
          fetchBrandsService()
        ]);

        setOrders(ordersData);
        setClients(clientsData);
        setVehicles(vehiclesData);
        setInventory(inventoryData);
        setServices(servicesData);
        setMechanics(usersData.filter(u => u.role === 'MECHANIC')); // Filter mechanics for UI
        setHistory(historyData);
        setTransactions(transactionsData);
        setGearboxes(enginesData);
        setSettings(settingsData || null);
        setBrands(brandsData);
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addHistoryLog = async (orderId: string, action: string, diff?: string) => {
    // Optimistic update
    const newLog: OrderHistory = {
      id: crypto.randomUUID(),
      orderId,
      action,
      diff,
      timestamp: new Date().toISOString(),
      userId: 'admin-01' // Placeholder
    };
    setHistory(prev => [newLog, ...prev]);

    try {
      await addHistoryService(newLog);
    } catch (err) {
      console.error("Failed to add history log", err);
    }
  };

  const createAuditLog = (orderId: string, oldData: WorkshopOrder, newData: Partial<WorkshopOrder>) => {
    const changes: string[] = [];
    const ignoreKeys = ['updatedAt', 'status', 'mechanicId', 'scheduledDate', 'documents', 'items']; // Ignored or handled elsewhere

    (Object.keys(newData) as Array<keyof WorkshopOrder>).forEach(key => {
      if (ignoreKeys.includes(key)) return;

      const oldVal = oldData[key];
      const newVal = newData[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        if (key === 'diagnosis') {
          // Skip - handled by specific 'Observação Adicionada' log in OSDetailsModal
        } else if (key === 'discount') {
          const val = typeof newVal === 'number' ? newVal : 0;
          changes.push(`Alterou o desconto para ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        } else if (key === 'discountType') {
          changes.push(`Alterou tipo de desconto para ${newVal === 'percent' ? '%' : 'R$'}`);
        } else if (key === 'notes') {
          changes.push('Atualizou observações do orçamento');
        } else {
          // Fallback for other fields (e.g. vehicleId if changed directly, though unlikely in this flow)
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

      // Speculative update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o));

      try {
        await updateOrderService(orderId, { status });
      } catch (err) {
        console.error("Failed to update status", err);
        // Revert? (For MVP we rely on no error)
      }
    }
  };

  const updateOrder = async (orderId: string, data: Partial<WorkshopOrder>) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Audit Log (Side Effect) - Must be outside setOrders
    createAuditLog(orderId, order, data);

    // Speculative Update
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, ...data, updatedAt: new Date().toISOString() };
      }
      return o;
    }));

    try {
      await updateOrderService(orderId, data);
    } catch (err) {
      console.error("Failed to update order", err);
    }
  };

  const addNewOrder = async (order: WorkshopOrder) => {
    // Optimistic
    setOrders(prev => [order, ...prev]);
    try {
      const newOrder = await createOrderService(order);
      // Update details if any changed (e.g. timestamp from DB)
      setOrders(prev => prev.map(o => o.id === order.id ? newOrder : o));
      return newOrder;
    } catch (err) {
      console.error("Failed to create order", err);
      setOrders(prev => prev.filter(o => o.id !== order.id)); // Revert
    }
  };

  const deleteOrder = async (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    try {
      await deleteOrderService(id);
    } catch (err) {
      console.error("Failed to delete order", err);
    }
  }

  // CRUD Implementations

  // Clients
  const addClient = async (client: Client) => {
    try {
      const newClient = await createClientService(client);
      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (err) {
      console.error("Failed to add client", err);
    }
  };
  const updateClient = async (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    await updateClientService(id, data);
  };
  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await deleteClientService(id);
  };

  // Vehicles
  const addVehicle = async (vehicle: Vehicle) => {
    try {
      const newVehicle = await createVehicleService(vehicle);
      setVehicles(prev => [...prev, newVehicle]);
      return newVehicle;
    } catch (err) {
      console.error("Failed to add vehicle", err);
    }
  };
  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
    await updateVehicleService(id, data);
  };
  const deleteVehicle = async (id: string) => {
    setVehicles(prev => prev.filter(item => item.id !== id));
    await deleteVehicleService(id);
  };

  // Gearboxes
  const addGearbox = async (gearbox: Gearbox) => {
    try {
      const newGearbox = await createGearboxService(gearbox);
      setGearboxes(prev => [...prev, newGearbox]);
    } catch (err) {
      console.error("Failed to add gearbox", err);
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

  // Inventory
  const addInventoryItem = async (item: InventoryItem) => {
    try {
      const newItem = await createInventoryItemService(item);
      setInventory(prev => [...prev, newItem]);
    } catch (err) {
      console.error("Failed to add inventory", err);
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

  // Transactions
  const addTransaction = async (transaction: Transaction) => {
    try {
      const newTransaction = await createTransactionService(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
    } catch (err: any) {
      console.error("Failed to add transaction", err);
      alert(`Erro ao salvar transação: ${err.message || JSON.stringify(err)}`);
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await deleteTransactionService(id);
  };

  // Mechanics / Users
  const addUser = async (user: Omit<User, 'id'>) => {
    try {
      const newUser = await createUserService(user);
      setMechanics(prev => [...prev, newUser]);
    } catch (err) {
      console.error("Failed to add user", err);
    }
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    setMechanics(prev => prev.map(u => u.id === id ? { ...u, ...user } : u));
    await updateUserService(id, user);
  };

  const deleteUser = async (id: string) => {
    setMechanics(prev => prev.filter(u => u.id !== id));
    await deleteUserService(id);
  };

  const contextValue = useMemo(() => ({
    orders, clients, vehicles, inventory, gearboxes, services, history, mechanics, transactions, settings, brands,
    setOrders, setClients, setVehicles, setGearboxes, setServices, setInventory, setSettings, setBrands,
    updateOrderStatus, updateOrder, addHistoryLog,
    addClient, updateClient, deleteClient,
    addVehicle, updateVehicle, deleteVehicle,
    addGearbox, updateGearbox, deleteGearbox,
    addBrand, deleteBrand,
    addService, updateService, deleteService,
    addInventoryItem, updateInventoryItem, deleteInventoryItem,
    addNewOrder,
    deleteOrder,
    addTransaction, deleteTransaction,
    addUser, updateUser, deleteUser
  }), [orders, clients, vehicles, inventory, gearboxes, services, history, mechanics, transactions, settings, brands, isLoading]);

  // Auth Loading State
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-slate-400 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Not Authenticated -> Show Login
  if (!isAuthenticated) {
    return <Login onSuccess={() => setIsAuthenticated(true)} />;
  }

  // Data Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-500 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <WorkshopContext.Provider value={contextValue}>
      <Router>
        <div className="flex h-screen bg-slate-50 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WorkshopContext.Provider>
  );
};

export default App;
