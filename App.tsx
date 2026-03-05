
import React, { useState, useMemo, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { useBranding } from './hooks/useBranding';
import { ThemeProvider } from './contexts/ThemeContext';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Agenda from './components/Agenda';
import Clients from './components/Clients';
import Inventory from './components/Inventory';
import Finance from './components/Finance';
import Settings from './components/Settings';
import Login from './components/Login';
import { useOrders } from './hooks/useOrders';
import { useClients } from './hooks/useClients';
import { useInventory } from './hooks/useInventory';
import { useFinance } from './hooks/useFinance';
import { fetchSettings as fetchSettingsService, updateSettings as updateSettingsService, supabase, getSession } from './services/supabase';
import { WorkshopSettings } from './types';

export const WorkshopContext = React.createContext<{
  orders: ReturnType<typeof useOrders>['orders'];
  clients: ReturnType<typeof useClients>['clients'];
  vehicles: ReturnType<typeof useClients>['vehicles'];
  inventory: ReturnType<typeof useInventory>['inventory'];
  gearboxes: ReturnType<typeof useInventory>['gearboxes'];
  services: ReturnType<typeof useInventory>['services'];
  mechanics: ReturnType<typeof useFinance>['mechanics'];
  history: ReturnType<typeof useOrders>['history'];
  transactions: ReturnType<typeof useFinance>['transactions'];
  settings: WorkshopSettings | null;
  brands: ReturnType<typeof useInventory>['brands'];
  paymentMethods: ReturnType<typeof useFinance>['paymentMethods'];
  setOrders: ReturnType<typeof useOrders>['setOrders'];
  setClients: ReturnType<typeof useClients>['setClients'];
  setVehicles: ReturnType<typeof useClients>['setVehicles'];
  setGearboxes: ReturnType<typeof useInventory>['setGearboxes'];
  setServices: ReturnType<typeof useInventory>['setServices'];
  setInventory: ReturnType<typeof useInventory>['setInventory'];
  setSettings: React.Dispatch<React.SetStateAction<WorkshopSettings | null>>;
  setBrands: ReturnType<typeof useInventory>['setBrands'];
  setPaymentMethods: ReturnType<typeof useFinance>['setPaymentMethods'];
  updateOrderStatus: ReturnType<typeof useOrders>['updateOrderStatus'];
  updateOrder: ReturnType<typeof useOrders>['updateOrder'];
  addHistoryLog: ReturnType<typeof useOrders>['addHistoryLog'];
  addClient: ReturnType<typeof useClients>['addClient'];
  updateClient: ReturnType<typeof useClients>['updateClient'];
  deleteClient: ReturnType<typeof useClients>['deleteClient'];
  addVehicle: ReturnType<typeof useClients>['addVehicle'];
  updateVehicle: ReturnType<typeof useClients>['updateVehicle'];
  deleteVehicle: ReturnType<typeof useClients>['deleteVehicle'];
  addGearbox: ReturnType<typeof useInventory>['addGearbox'];
  updateGearbox: ReturnType<typeof useInventory>['updateGearbox'];
  deleteGearbox: ReturnType<typeof useInventory>['deleteGearbox'];
  addBrand: ReturnType<typeof useInventory>['addBrand'];
  deleteBrand: ReturnType<typeof useInventory>['deleteBrand'];
  addService: ReturnType<typeof useInventory>['addService'];
  updateService: ReturnType<typeof useInventory>['updateService'];
  deleteService: ReturnType<typeof useInventory>['deleteService'];
  addInventoryItem: ReturnType<typeof useInventory>['addInventoryItem'];
  updateInventoryItem: ReturnType<typeof useInventory>['updateInventoryItem'];
  deleteInventoryItem: ReturnType<typeof useInventory>['deleteInventoryItem'];
  addNewOrder: ReturnType<typeof useOrders>['addNewOrder'];
  addTransaction: ReturnType<typeof useFinance>['addTransaction'];
  deleteTransaction: ReturnType<typeof useFinance>['deleteTransaction'];
  addUser: ReturnType<typeof useFinance>['addUser'];
  updateUser: ReturnType<typeof useFinance>['updateUser'];
  deleteUser: ReturnType<typeof useFinance>['deleteUser'];
  addPaymentMethod: ReturnType<typeof useFinance>['addPaymentMethod'];
  deletePaymentMethod: ReturnType<typeof useFinance>['deletePaymentMethod'];
  togglePaymentMethod: ReturnType<typeof useFinance>['togglePaymentMethod'];
  deleteOrder: ReturnType<typeof useOrders>['deleteOrder'];
} | null>(null);

const App: React.FC = () => {
  const [settings, setSettings] = useState<WorkshopSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const ordersHook = useOrders();
  const clientsHook = useClients();
  const inventoryHook = useInventory();
  const financeHook = useFinance();

  useBranding(settings);

  // Auth Check
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load All Data
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [settingsData] = await Promise.all([
          fetchSettingsService(),
          ordersHook.load(),
          clientsHook.load(),
          inventoryHook.load(),
          financeHook.load()
        ]);
        setSettings(settingsData || null);
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        toast.error('Erro ao carregar dados do sistema. Verifique sua conexão.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const contextValue = useMemo(() => ({
    orders: ordersHook.orders,
    clients: clientsHook.clients,
    vehicles: clientsHook.vehicles,
    inventory: inventoryHook.inventory,
    gearboxes: inventoryHook.gearboxes,
    services: inventoryHook.services,
    mechanics: financeHook.mechanics,
    history: ordersHook.history,
    transactions: financeHook.transactions,
    settings,
    brands: inventoryHook.brands,
    paymentMethods: financeHook.paymentMethods,
    setOrders: ordersHook.setOrders,
    setClients: clientsHook.setClients,
    setVehicles: clientsHook.setVehicles,
    setGearboxes: inventoryHook.setGearboxes,
    setServices: inventoryHook.setServices,
    setInventory: inventoryHook.setInventory,
    setSettings,
    setBrands: inventoryHook.setBrands,
    setPaymentMethods: financeHook.setPaymentMethods,
    updateOrderStatus: ordersHook.updateOrderStatus,
    updateOrder: ordersHook.updateOrder,
    addHistoryLog: ordersHook.addHistoryLog,
    addClient: clientsHook.addClient,
    updateClient: clientsHook.updateClient,
    deleteClient: clientsHook.deleteClient,
    addVehicle: clientsHook.addVehicle,
    updateVehicle: clientsHook.updateVehicle,
    deleteVehicle: clientsHook.deleteVehicle,
    addGearbox: inventoryHook.addGearbox,
    updateGearbox: inventoryHook.updateGearbox,
    deleteGearbox: inventoryHook.deleteGearbox,
    addBrand: inventoryHook.addBrand,
    deleteBrand: inventoryHook.deleteBrand,
    addService: inventoryHook.addService,
    updateService: inventoryHook.updateService,
    deleteService: inventoryHook.deleteService,
    addInventoryItem: inventoryHook.addInventoryItem,
    updateInventoryItem: inventoryHook.updateInventoryItem,
    deleteInventoryItem: inventoryHook.deleteInventoryItem,
    addNewOrder: ordersHook.addNewOrder,
    deleteOrder: ordersHook.deleteOrder,
    addTransaction: financeHook.addTransaction,
    deleteTransaction: financeHook.deleteTransaction,
    addUser: financeHook.addUser,
    updateUser: financeHook.updateUser,
    deleteUser: financeHook.deleteUser,
    addPaymentMethod: financeHook.addPaymentMethod,
    deletePaymentMethod: financeHook.deletePaymentMethod,
    togglePaymentMethod: financeHook.togglePaymentMethod
  }), [
    ordersHook.orders, ordersHook.history,
    clientsHook.clients, clientsHook.vehicles,
    inventoryHook.inventory, inventoryHook.services, inventoryHook.gearboxes, inventoryHook.brands,
    financeHook.transactions, financeHook.paymentMethods, financeHook.mechanics,
    settings
  ]);

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

  if (!isAuthenticated) {
    return <Login onSuccess={() => setIsAuthenticated(true)} />;
  }

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
    <ThemeProvider>
      <Toaster position="bottom-right" richColors closeButton />
      <WorkshopContext.Provider value={contextValue}>
        <Router>
          <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
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
    </ThemeProvider>
  );
};

export default App;
