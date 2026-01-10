/// <reference types="vite/client" />
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Client, Vehicle, WorkshopOrder, InventoryItem, User, Transaction, Gearbox, Service, OSStatus, Priority, VehicleCategory, OrderItem, ChecklistItem, OrderHistory, WorkshopSettings, OrderDocument } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

/**
 * MAPPERS (Portuguese DB <-> English App Types)
 */

const getNextId = async (table: string): Promise<string> => {
  const { data, error } = await supabase.from(table).select('id');
  if (error) {
    console.error(`Error fetching IDs for ${table}`, error);
    return '01';
  }
  const ids = data.map(d => parseInt(d.id, 10)).filter(n => !isNaN(n));
  const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  return String(nextId).padStart(2, '0');
};

const mapUserFromDB = (u: any): User => ({
  id: u.id,
  name: u.nome,
  role: u.papel
});

const mapClientFromDB = (c: any): Client => ({
  id: c.id,
  name: c.nome,
  email: c.email,
  phone: c.telefone,
  cpf: c.cpf,
  address: c.endereco,
  addressNumber: c.numero_endereco,
  city: c.cidade,
  zipCode: c.cep,
  neighborhood: c.bairro,
  state: c.estado
});

const mapVehicleFromDB = (v: any): Vehicle => ({
  id: v.id,
  clientId: v.id_cliente,
  plate: v.placa,
  model: v.modelo,
  brand: v.marca,
  year: v.ano,
  color: v.cor
});

const mapServiceFromDB = (s: any): Service => ({
  id: s.id,
  code: s.codigo,
  name: s.nome,
  category: s.categoria,
  price: Number(s.preco),
  time: s.tempo
});

const mapInventoryItemFromDB = (i: any): InventoryItem => ({
  id: i.id,
  code: i.codigo,
  name: i.nome,
  supplier: i.fornecedor,
  costPrice: Number(i.preco_custo),
  salePrice: Number(i.preco_venda),
  stock: i.estoque,
  minStock: i.estoque_minimo
});

const mapOrderFromDB = (o: any, items: any[] = [], checklist: any[] = []): WorkshopOrder => ({
  id: o.id,
  vehicleId: o.id_veiculo,
  status: o.status as OSStatus,
  priority: o.prioridade as Priority,
  category: o.categoria as VehicleCategory,
  km: o.quilometragem,
  fuelLevel: o.nivel_combustivel,
  reportedFault: o.defeito_relatado,
  diagnosis: o.diagnostico || undefined,
  mechanicId: o.id_mecanico || undefined,
  scheduledDate: o.data_agendamento,
  estimatedDuration: o.duracao_estimada,
  discount: Number(o.desconto || 0),
  discountType: o.tipo_desconto || 'value',
  notes: o.observacoes || undefined,
  items: items.map(i => ({
    id: i.id,
    type: i.tipo,
    description: i.descricao,
    quantity: Number(i.quantidade),
    price: Number(i.preco)
  })),
  checklist: checklist.map(c => ({
    id: c.id,
    label: c.rotulo,
    checked: c.marcado
  })),
  documents: (o.order_documents || []).map((d: any) => ({
    id: d.id,
    orderId: d.order_id,
    name: d.name,
    url: d.url,
    type: d.type,
    createdAt: d.created_at
  })),
  createdAt: o.criado_em,
  updatedAt: o.atualizado_em || o.criado_em
});

const mapHistoryFromDB = (h: any): OrderHistory => ({
  id: h.id,
  orderId: h.id_ordem,
  action: h.acao,
  diff: h.diff || undefined,
  timestamp: h.data_hora,
  userId: h.id_usuario || 'admin'
});

/**
 * SERVICE METHODS
 */

// USERS
export const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('usuarios').select('*');
  if (error) throw error;
  return data.map(mapUserFromDB);
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  const id = await getNextId('usuarios');
  const { data, error } = await supabase.from('usuarios').insert({
    id,
    nome: user.name,
    papel: user.role
  }).select().single();

  if (error) throw error;
  return mapUserFromDB(data);
};

export const updateUser = async (id: string, updates: Partial<User>) => {
  const dbUpdates: any = {};
  if (updates.name) dbUpdates.nome = updates.name;
  if (updates.role) dbUpdates.papel = updates.role;

  const { error } = await supabase.from('usuarios').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) throw error;
};

// CLIENTS
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

// VEHICLES
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

// INVENTORY
export const fetchInventory = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase.from('itens_estoque').select('*');
  if (error) throw error;
  return data.map(mapInventoryItemFromDB);
};

export const createInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  const id = await getNextId('itens_estoque');
  const code = id; // Auto-generate code equal to ID

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

// SERVICES
export const fetchServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase.from('servicos').select('*');
  if (error) throw error;
  return data.map(mapServiceFromDB);
};

// ORDERS
export const fetchOrders = async (): Promise<WorkshopOrder[]> => {
  const { data: orders, error } = await supabase.from('ordens_servico').select('*');
  if (error) throw error;
  if (!orders) return [];

  // Fetch items and checklist for all orders (naive approach, could be optimized with joins or lazy loading)
  // For this size of app, fetching all is okay-ish, or we use a join query.
  // Let's use a join query: select *, itens_ordem(*), itens_checklist(*)

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
  // 1. Insert Order
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

  // 2. Insert Items if any (usually none on creation in this flow, but good to handle)
  // 3. Insert Checklist if any

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
  if (updates.scheduledDate !== undefined) db.data_agendamento = updates.scheduledDate;
  if (updates.estimatedDuration !== undefined) db.duracao_estimada = updates.estimatedDuration;
  if (updates.discount !== undefined) db.desconto = updates.discount;
  if (updates.discountType !== undefined) db.tipo_desconto = updates.discountType;
  if (updates.notes !== undefined) db.observacoes = updates.notes;

  db.atualizado_em = new Date().toISOString();

  const { error } = await supabase.from('ordens_servico').update(db).eq('id', orderId);
  if (error) throw error;

  // Handle Checklist Updates
  if (updates.checklist) {
    // 1. Delete existing items (simplest strategy to handle reordering/deletions)
    const { error: deleteError } = await supabase.from('itens_checklist').delete().eq('id_ordem', orderId);
    if (deleteError) throw deleteError;

    // 2. Insert new items
    if (updates.checklist.length > 0) {
      const { error: insertError } = await supabase.from('itens_checklist').insert(
        updates.checklist.map(item => {
          const dbItem: any = {
            id_ordem: orderId,
            rotulo: item.label,
            marcado: item.checked
          };
          // Only include ID if it's a real DB UUID (not a temporary UI ID)
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

export const addOrderItem = async (orderId: string, item: OrderItem): Promise<OrderItem> => {
  const newId = await getNextId('itens_ordem');
  const { data, error } = await supabase.from('itens_ordem').insert({
    id: newId,
    id_ordem: orderId,
    tipo: item.type,
    descricao: item.description,
    quantidade: item.quantity,
    preco: item.price
  }).select().single();

  if (error) throw error;

  return {
    id: data.id,
    type: data.tipo,
    description: data.descricao,
    quantity: Number(data.quantidade),
    price: Number(data.preco)
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

// HISTORY
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

// DELETE OPERATIONS & SERVICES CRUD

export const deleteClient = async (id: string) => {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
};

export const deleteVehicle = async (id: string) => {
  const { error } = await supabase.from('veiculos').delete().eq('id', id);
  if (error) throw error;
};

export const deleteInventoryItem = async (id: string) => {
  const { error } = await supabase.from('itens_estoque').delete().eq('id', id);
  if (error) throw error;
};

// Services Table CRUD
export const createService = async (service: Service): Promise<Service> => {
  const newId = await getNextId('servicos');
  const code = newId; // Auto-generate code equal to ID

  const { data, error } = await supabase.from('servicos').insert({
    id: newId,
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

// Transactions
const mapTransactionFromDB = (db: any): Transaction => ({
  id: db.id,
  description: db.descricao,
  category: db.categoria,
  amount: Number(db.valor),
  type: db.tipo,
  status: db.status,
  date: db.data,
  orderId: db.id_ordem
});

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
    id_ordem: transaction.orderId
  }).select().single();

  if (error) throw error;
  return mapTransactionFromDB(data);
};

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase.from('transacoes').delete().eq('id', id);
  if (error) throw error;
};

// Gearboxes
const mapGearboxFromDB = (db: any): Gearbox => ({
  id: db.id,
  code: db.codigo,
  model: db.modelo,
  brand: db.marca,
  type: db.tipo,
  specs: db.specs,
  assemblyTime: db.tempo_montagem
});

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

// Settings
export const fetchSettings = async (): Promise<WorkshopSettings | null> => {
  const { data, error } = await supabase.from('configuracoes').select('*').eq('id', 'geral').single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching settings:', error);
    return null;
  }
  // Map DB column to app field
  return {
    ...data,
    whatsappMessageTemplate: data.whatsapp_message_template
  };
};

export const updateSettings = async (settings: Partial<WorkshopSettings>) => {
  // Map app field to DB column
  const dbPayload: any = { id: 'geral' };

  if (settings.nome_oficina !== undefined) dbPayload.nome_oficina = settings.nome_oficina;
  if (settings.cnpj !== undefined) dbPayload.cnpj = settings.cnpj;
  if (settings.email !== undefined) dbPayload.email = settings.email;
  if (settings.telefone !== undefined) dbPayload.telefone = settings.telefone;
  if (settings.cep !== undefined) dbPayload.cep = settings.cep;
  if (settings.endereco !== undefined) dbPayload.endereco = settings.endereco;
  if (settings.numero !== undefined) dbPayload.numero = settings.numero;
  if (settings.bairro !== undefined) dbPayload.bairro = settings.bairro;
  if (settings.cidade !== undefined) dbPayload.cidade = settings.cidade;
  if (settings.estado !== undefined) dbPayload.estado = settings.estado;
  if (settings.logo_url !== undefined) dbPayload.logo_url = settings.logo_url;
  if (settings.horario_funcionamento !== undefined) dbPayload.horario_funcionamento = settings.horario_funcionamento;
  if (settings.whatsappMessageTemplate !== undefined) dbPayload.whatsapp_message_template = settings.whatsappMessageTemplate;

  const { error } = await supabase.from('configuracoes').upsert(dbPayload);
  if (error) throw error;
};

export const uploadLogo = async (file: File): Promise<{ url: string | null; error?: string }> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `logo-${Date.now()}.${fileExt}`;

  // Use upsert to allow overwriting, though timestamp makes collision unlikely
  const { data, error } = await supabase.storage.from('company-assets').upload(fileName, file, {
    cacheControl: '3600',
    upsert: true
  });

  if (error) {
    console.error('Error uploading logo:', error);
    return { url: null, error: error.message };
  }

  const { data: { publicUrl } } = supabase.storage.from('company-assets').getPublicUrl(fileName);
  return { url: publicUrl };
};

// BRANDS
const mapBrandFromDB = (b: any): import('../types').Brand => ({
  id: b.id,
  name: b.nome,
  logo: b.logo_url
});

export const fetchBrands = async (): Promise<import('../types').Brand[]> => {
  const { data, error } = await supabase.from('marcas').select('*').order('nome');
  if (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
  return data.map(mapBrandFromDB);
};

export const createBrand = async (brand: import('../types').Brand): Promise<import('../types').Brand> => {
  const newId = await getNextId('marcas');
  const { data, error } = await supabase.from('marcas').insert({
    id: newId,
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

// DOCUMENTS
export const uploadDocument = async (orderId: string, file: File, customName?: string): Promise<{ data: OrderDocument | null; error?: string }> => {
  // 1. Upload to Storage
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

  // 2. Insert into Table
  // Generate a random ID since getNextId might not be configured for documents
  const newId = `doc-${Date.now()}-${mathRandomString()}`;

  // Reverting to Public URL because custom domain routing (Worker) is not active/working yet.
  // const customUrl = `https://kellretifica.online/orcamentos/${fileName}`;

  const { data: docData, error: docError } = await supabase.from('order_documents').insert({
    id: newId,
    order_id: orderId,
    name: customName || file.name,
    url: publicUrl, // Use correct publicUrl
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
  // 1. Delete from Table
  const { error: dbError } = await supabase.from('order_documents').delete().eq('id', id);
  if (dbError) throw dbError;

  // 2. Delete from Storage (Optional but recommended to save space)
  // Extract path from URL... usually ends with orderId/filename
  // This is a bit complex without exact path parsing logic, so we skip for now 
  // or do a best effort if we stored the path. Ideally we store storage_path in DB.
};

export const deleteOrder = async (id: string) => {
  // Cascading deletes usually handled by DB, but if strict FK without Cascade:
  // 1. Delete Items
  await supabase.from('itens_ordem').delete().eq('id_ordem', id);
  // 2. Delete Checklist
  await supabase.from('itens_checklist').delete().eq('id_ordem', id);
  // 3. Delete History
  await supabase.from('historico_ordem').delete().eq('id_ordem', id);
  // 4. Delete Doc Metadata
  await supabase.from('order_documents').delete().eq('order_id', id);

  // 5. Delete Order
  const { error } = await supabase.from('ordens_servico').delete().eq('id', id);
  if (error) throw error;
};

function mathRandomString() {
  return Math.random().toString(36).substring(2, 15);
}

// ========================================
// AUTHENTICATION FUNCTIONS
// ========================================

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
};

