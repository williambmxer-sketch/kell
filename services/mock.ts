
import {
    WorkshopOrder, Client, Vehicle, InventoryItem, Service, User,
    Transaction, Gearbox, WorkshopSettings, OrderHistory, Brand,
    OrderItem, ChecklistItem, OSStatus, Priority, VehicleCategory,
    OrderDocument
} from '../types';

// ============================================================================
// MOCK DATA STORE
// ============================================================================

// Key for localStorage
const STORE_KEY = 'workshop_demo_data';

interface DataStore {
    orders: WorkshopOrder[];
    clients: Client[];
    vehicles: Vehicle[];
    inventory: InventoryItem[];
    services: Service[];
    users: User[];
    transactions: Transaction[];
    gearboxes: Gearbox[];
    settings: WorkshopSettings | null;
    history: OrderHistory[];
    brands: Brand[];
}

// Initial Mock Data
const INITIAL_DATA: DataStore = {
    users: [
        { id: 'u1', name: 'Administrador', role: 'ADMIN' },
        { id: 'u2', name: 'Mecânico João', role: 'MECHANIC' },
        { id: 'u3', name: 'Mecânico Pedro', role: 'MECHANIC' },
        { id: 'u4', name: 'Recepção', role: 'ADVISOR' }
    ],
    clients: [
        { id: 'c1', name: 'Roberto Silva', email: 'roberto@email.com', phone: '(11) 99999-0000', cpf: '123.456.789-00', address: 'Rua A, 123', city: 'São Paulo', state: 'SP' },
        { id: 'c2', name: 'Maria Oliveira', email: 'maria@email.com', phone: '(11) 98888-1111', cpf: '234.567.890-11', address: 'Av B, 456', city: 'São Paulo', state: 'SP' },
        { id: 'c3', name: 'Empresa XYZ', email: 'contato@xyz.com.br', phone: '(11) 3000-4000', cpf: '55.444.333/0001-22', address: 'Centro Empresarial', city: 'Barueri', state: 'SP', type: 'COMPANY' }
    ],
    vehicles: [
        { id: 'v1', clientId: 'c1', plate: 'ABC-1234', brand: 'Toyota', model: 'Corolla', year: 2020, color: 'Prata' },
        { id: 'v2', clientId: 'c2', plate: 'XYZ-9876', brand: 'Honda', model: 'Civic', year: 2019, color: 'Preto' },
        { id: 'v3', clientId: 'c3', plate: 'FRO-5555', brand: 'Fiat', model: 'Fiorino', year: 2022, color: 'Branco' }
    ],
    inventory: [
        { id: 'i1', code: 'OLEO5W30', name: 'Óleo Sintético 5W30', supplier: 'Shell', costPrice: 35.00, salePrice: 65.00, stock: 50, minStock: 10 },
        { id: 'i2', code: 'FILTRO-OLEO', name: 'Filtro de Óleo', supplier: 'Tecfil', costPrice: 15.00, salePrice: 35.00, stock: 30, minStock: 5 },
        { id: 'i3', code: 'PASTILHA-D', name: 'Pastilha de Freio Diant.', supplier: 'Bosch', costPrice: 80.00, salePrice: 180.00, stock: 12, minStock: 4 }
    ],
    services: [
        { id: 's1', code: 'SERV001', name: 'Troca de Óleo', category: 'Manutenção', price: 80.00, time: '0:30' },
        { id: 's2', code: 'SERV002', name: 'Alinhamento 3D', category: 'Suspensão', price: 120.00, time: '1:00' },
        { id: 's3', code: 'SERV003', name: 'Revisão Geral', category: 'Revisão', price: 450.00, time: '4:00' }
    ],
    orders: [
        {
            id: 'os-001',
            vehicleId: 'v1',
            status: OSStatus.RECEPTION,
            priority: Priority.MEDIUM,
            category: VehicleCategory.PRIVATE,
            km: 45000,
            fuelLevel: 50,
            reportedFault: 'Barulho na suspensão dianteira ao passar em lombadas',
            items: [],
            checklist: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'os-002',
            vehicleId: 'v2',
            status: OSStatus.EXECUTION,
            priority: Priority.HIGH,
            category: VehicleCategory.PRIVATE,
            km: 62000,
            fuelLevel: 75,
            reportedFault: 'Luz de injeção acesa',
            diagnosis: 'Falha no sensor de oxigênio banco 1',
            mechanicId: 'u2',
            items: [
                { id: 'item-1', type: 'PART', description: 'Sensor de Oxigênio', quantity: 1, price: 350.00 },
                { id: 'item-2', type: 'SERVICE', description: 'Troca de Sensor e Scanner', quantity: 1, price: 150.00 }
            ],
            checklist: [],
            createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            updatedAt: new Date().toISOString()
        }
    ],
    gearboxes: [
        { id: 'gb1', code: 'AL4', brand: 'Peugeot/Citroen', model: 'AL4 / DP0', type: 'Automático', specs: '4 Marchas', assemblyTime: '04:00' },
        { id: 'gb2', code: 'TF72', brand: 'Mini/BMW', model: 'TF72 SC', type: 'Automático', specs: '6 Marchas', assemblyTime: '06:00' }
    ],
    transactions: [],
    history: [],
    brands: [
        { id: 'b1', name: 'Volkswagen' },
        { id: 'b2', name: 'Chevrolet' },
        { id: 'b3', name: 'Fiat' },
        { id: 'b4', name: 'Ford' },
        { id: 'b5', name: 'Toyota' },
        { id: 'b6', name: 'Honda' },
    ],
    settings: {
        id: 'geral',
        nome_oficina: 'Oficina Demo Local',
        cnpj: '00.000.000/0000-00',
        email: 'contato@demo.com.br',
        telefone: '(11) 99999-9999',
        endereco: 'Rua Exemplo, 100',
        cidade: 'Cidade Demo',
        estado: 'SP'
    }
};

// ============================================================================
// LOCAL STORAGE HELPER
// ============================================================================

const loadStore = (): DataStore => {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Failed to load local store', e);
    }
    return INITIAL_DATA;
};

const saveStore = (data: DataStore) => {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
};

// Initialize or Load
let store = loadStore();

// Utility for async delay to simulate network
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

// --- Users ---
export const fetchUsers = async (): Promise<User[]> => { await delay(); return store.users; }
export const createUser = async (u: Omit<User, 'id'>): Promise<User> => {
    await delay();
    const newUser = { ...u, id: crypto.randomUUID() };
    store = { ...store, users: [...store.users, newUser] };
    saveStore(store);
    return newUser;
};
export const updateUser = async (id: string, u: Partial<User>) => {
    await delay();
    store = { ...store, users: store.users.map(x => x.id === id ? { ...x, ...u } : x) };
    saveStore(store);
};
export const deleteUser = async (id: string) => {
    await delay();
    store = { ...store, users: store.users.filter(x => x.id !== id) };
    saveStore(store);
};

// --- Clients ---
export const fetchClients = async () => { await delay(); return store.clients; }
export const createClient = async (c: Omit<Client, 'id'>) => {
    await delay();
    const newItem = { ...c, id: crypto.randomUUID() };
    store = { ...store, clients: [...store.clients, newItem] };
    saveStore(store);
    return newItem;
}
export const updateClient = async (id: string, c: Partial<Client>) => {
    await delay();
    store = { ...store, clients: store.clients.map(x => x.id === id ? { ...x, ...c } : x) };
    saveStore(store);
}
export const deleteClient = async (id: string) => {
    await delay();
    store = { ...store, clients: store.clients.filter(x => x.id !== id) };
    saveStore(store);
}

// --- Vehicles ---
export const fetchVehicles = async () => { await delay(); return store.vehicles; }
export const createVehicle = async (v: Omit<Vehicle, 'id'>) => {
    await delay();
    const newItem = { ...v, id: crypto.randomUUID() };
    store = { ...store, vehicles: [...store.vehicles, newItem] };
    saveStore(store);
    return newItem;
}
export const updateVehicle = async (id: string, v: Partial<Vehicle>) => {
    await delay();
    store = { ...store, vehicles: store.vehicles.map(x => x.id === id ? { ...x, ...v } : x) };
    saveStore(store);
}
export const deleteVehicle = async (id: string) => {
    await delay();
    store = { ...store, vehicles: store.vehicles.filter(x => x.id !== id) };
    saveStore(store);
}

// --- Inventory ---
export const fetchInventory = async () => { await delay(); return store.inventory; }
export const createInventoryItem = async (i: Omit<InventoryItem, 'id'>) => {
    await delay();
    const newItem = { ...i, id: crypto.randomUUID() };
    store = { ...store, inventory: [...store.inventory, newItem] };
    saveStore(store);
    return newItem;
}
export const updateInventoryItem = async (id: string, i: Partial<InventoryItem>) => {
    await delay();
    store = { ...store, inventory: store.inventory.map(x => x.id === id ? { ...x, ...i } : x) };
    saveStore(store);
}
export const deleteInventoryItem = async (id: string) => {
    await delay();
    store = { ...store, inventory: store.inventory.filter(x => x.id !== id) };
    saveStore(store);
}

// --- Services ---
export const fetchServices = async () => { await delay(); return store.services; }
export const createService = async (s: Omit<Service, 'id'>) => { // Fixed type match
    await delay();
    const newItem = { ...s, id: crypto.randomUUID() };
    store = { ...store, services: [...store.services, newItem] };
    saveStore(store);
    return newItem;
}
export const updateService = async (id: string, s: Partial<Service>) => {
    await delay();
    store = { ...store, services: store.services.map(x => x.id === id ? { ...x, ...s } : x) };
    saveStore(store);
}
export const deleteService = async (id: string) => {
    await delay();
    store = { ...store, services: store.services.filter(x => x.id !== id) };
    saveStore(store);
}

// --- Gearboxes ---
export const fetchGearboxes = async () => { await delay(); return store.gearboxes; }
export const createGearbox = async (g: Gearbox) => { // Fixed type match
    await delay();
    const newItem = { ...g, id: crypto.randomUUID() };
    store = { ...store, gearboxes: [...store.gearboxes, newItem] };
    saveStore(store);
    return newItem;
}
export const updateGearbox = async (id: string, g: Partial<Gearbox>) => {
    await delay();
    store = { ...store, gearboxes: store.gearboxes.map(x => x.id === id ? { ...x, ...g } : x) };
    saveStore(store);
}
export const deleteGearbox = async (id: string) => {
    await delay();
    store = { ...store, gearboxes: store.gearboxes.filter(x => x.id !== id) };
    saveStore(store);
}

// --- Transactions ---
export const fetchTransactions = async () => { await delay(); return store.transactions; }
export const createTransaction = async (t: Transaction) => {
    await delay();
    const newItem = { ...t, id: crypto.randomUUID() };
    store = { ...store, transactions: [newItem, ...store.transactions] };
    saveStore(store);
    return newItem;
}
export const deleteTransaction = async (id: string) => {
    await delay();
    store = { ...store, transactions: store.transactions.filter(x => x.id !== id) };
    saveStore(store);
}

// --- Brands ---
export const fetchBrands = async () => { await delay(); return store.brands; }
export const createBrand = async (b: Brand) => {
    await delay();
    const newItem = { ...b, id: crypto.randomUUID() };
    store = { ...store, brands: [...store.brands, newItem] };
    saveStore(store);
    return newItem;
}
export const deleteBrand = async (id: string) => {
    await delay();
    store = { ...store, brands: store.brands.filter(x => x.id !== id) };
    saveStore(store);
}

// --- Settings ---
export const fetchSettings = async () => { await delay(); return store.settings; }
export const updateSettings = async (s: Partial<WorkshopSettings>) => {
    await delay();
    store = { ...store, settings: { ...store.settings!, ...s } };
    saveStore(store);
}
// Logo upload mock
export const uploadLogo = async (file: File) => {
    await delay();
    return { url: URL.createObjectURL(file), error: null };
}

// --- Orders ---
export const fetchOrders = async () => { await delay(); return store.orders; }

export const createOrder = async (order: WorkshopOrder) => {
    await delay();
    const newOrder = { ...order, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    store = { ...store, orders: [newOrder, ...store.orders] };
    saveStore(store);
    return newOrder;
}

export const updateOrder = async (orderId: string, updates: Partial<WorkshopOrder>) => {
    await delay();
    store = {
        ...store,
        orders: store.orders.map(o => o.id === orderId ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o)
    };
    saveStore(store);
}

export const deleteOrder = async (id: string) => {
    await delay();
    store = { ...store, orders: store.orders.filter(o => o.id !== id) };
    saveStore(store);
}

// Order Items / Checklist
export const addOrderItem = async (orderId: string, item: OrderItem) => {
    await delay();
    // We need to find the order and push item to it
    // But wait, the app structure passes item object often.
    // In `supabase.ts`, it inserts to a separate table.
    // In `mock`, we probably just update the order object since our order object has `items` array.

    const order = store.orders.find(o => o.id === orderId);
    if (order) {
        const newItem = { ...item, id: crypto.randomUUID() };
        const newItems = [...(order.items || []), newItem];
        await updateOrder(orderId, { items: newItems });
        return newItem;
    }
    throw new Error("Order not found");
}

export const updateOrderItem = async (itemId: string, updates: { quantity: number, price?: number }) => {
    await delay();
    // This is tricky because items are nested.
    // We'll iterate all orders to find it.
    for (let o of store.orders) {
        const itemIndex = o.items.findIndex(i => i.id === itemId);
        if (itemIndex >= 0) {
            const newItems = [...o.items];
            newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
            await updateOrder(o.id, { items: newItems });
            return;
        }
    }
}

export const deleteOrderItem = async (itemId: string) => {
    await delay();
    for (let o of store.orders) {
        if (o.items.some(i => i.id === itemId)) {
            const newItems = o.items.filter(i => i.id !== itemId);
            await updateOrder(o.id, { items: newItems });
            return;
        }
    }
}

// --- History ---
export const fetchHistory = async () => { await delay(); return store.history; }
export const addHistory = async (log: OrderHistory) => {
    await delay();
    store = { ...store, history: [log, ...store.history] };
    saveStore(store);
}

// --- Documents ---
export const uploadDocument = async (orderId: string, file: File, customName?: string) => {
    await delay();
    const newDoc: OrderDocument = {
        id: crypto.randomUUID(),
        orderId,
        name: customName || file.name,
        url: URL.createObjectURL(file), // Local blob URL
        type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        createdAt: new Date().toISOString()
    };

    // We need to add this to the order's documents array
    const order = store.orders.find(o => o.id === orderId);
    if (order) {
        const newDocs = [...(order.documents || []), newDoc];
        await updateOrder(orderId, { documents: newDocs });
        return { data: newDoc };
    }
    return { data: null, error: 'Order not found' };
};

export const deleteDocument = async (id: string, pathUrl: string) => {
    await delay();
    for (let o of store.orders) {
        if (o.documents?.some(d => d.id === id)) {
            const newDocs = o.documents.filter(d => d.id !== id);
            await updateOrder(o.id, { documents: newDocs });
            return;
        }
    }
}

// ============================================================================
// SUPABASE AUTH MOCK
// ============================================================================

export const supabase = {
    auth: {
        onAuthStateChange: (callback: (event: string, session: any) => void) => {
            // Mock immediately logged in
            setTimeout(() => callback('SIGNED_IN', { user: { id: 'local-user', email: 'demo@local.com' } }), 100);
            return { data: { subscription: { unsubscribe: () => { } } } };
        },
        signInWithPassword: async ({ email, password }: any) => {
            await delay(500);
            if (password === '123456') { // Mock Simple password
                return { data: { user: { id: 'local-user', email } }, error: null };
            }
            // Actually, for demo, let's just allow anything
            return { data: { user: { id: 'local-user', email } }, error: null };
        },
        signOut: async () => {
            await delay();
            window.location.reload(); // Simple way to reset state
            return { error: null };
        },
        getSession: async () => {
            return { data: { session: { user: { id: 'local-user' } } }, error: null };
        },
        updateUser: async (attrs: any) => {
            await delay();
            return { data: {}, error: null };
        },
        getUser: async () => {
            return { data: { user: { id: 'local-user' } } };
        }
    },
    storage: {
        from: (bucket: string) => ({
            upload: async () => ({ data: {}, error: null }),
            getPublicUrl: (path: string) => ({ data: { publicUrl: path } })
        })
    }
};

export const getSession = supabase.auth.getSession;
export const signIn = async (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
export const signOut = supabase.auth.signOut;
export const updatePassword = async (password: string) => supabase.auth.updateUser({ password });
