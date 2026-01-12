# Guia de Implementação Multi-Tenant - OPÇÃO 1

## Modificações Necessárias no Código

### 1. Adicionar Helper Function (linha 14)

```typescript
/**
 * MULTI-TENANT HELPER
 */
const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
};
```

### 2. Modificar TODAS as funções create*

#### createUser (linha 139-149)
```typescript
export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  const user_id = await getCurrentUserId();
  const id = await getNextId('usuarios');
  const { data, error } = await supabase.from('usuarios').insert({
    id,
    user_id,  // ADICIONAR
    nome: user.name,
    papel: user.role
  }).select().single();

  if (error) throw error;
  return mapUserFromDB(data);
};
```

#### createClient (linha 172-190)
```typescript
export const createClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
  const user_id = await getCurrentUserId();
  const id = await getNextId('clientes');
  const { data, error } = await supabase.from('clientes').insert({
    id,
    user_id,  // ADICIONAR
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
```

#### createVehicle (linha 216-230)
```typescript
export const createVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  const user_id = await getCurrentUserId();
  const id = await getNextId('veiculos');
  const { data, error } = await supabase.from('veiculos').insert({
    id,
    user_id,  // ADICIONAR
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
```

#### createInventoryItem (linha 252-268)
```typescript
export const createInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  const user_id = await getCurrentUserId();
  const id = await getNextId('itens_estoque');
  const code = id;

  const { data, error } = await supabase.from('itens_estoque').insert({
    id,
    user_id,  // ADICIONAR
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
```

#### createOrder (linha 315-341)
```typescript
export const createOrder = async (order: WorkshopOrder): Promise<WorkshopOrder> => {
  const user_id = await getCurrentUserId();
  const newId = await getNextId('ordens_servico');
  const { data: newOrder, error } = await supabase.from('ordens_servico').insert({
    id: newId,
    user_id,  // ADICIONAR
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
```

#### addOrderItem (linha 393-413)
```typescript
export const addOrderItem = async (orderId: string, item: OrderItem): Promise<OrderItem> => {
  const user_id = await getCurrentUserId();
  const newId = await getNextId('itens_ordem');
  const { data, error } = await supabase.from('itens_ordem').insert({
    id: newId,
    user_id,  // ADICIONAR
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
```

#### addHistory (linha 437-447)
```typescript
export const addHistory = async (log: OrderHistory) => {
  const user_id = await getCurrentUserId();
  const { error } = await supabase.from('historico_ordem').insert({
    id: log.id,
    user_id,  // ADICIONAR
    id_ordem: log.orderId,
    acao: log.action,
    diff: log.diff,
    data_hora: log.timestamp,
    id_usuario: null
  });
  if (error) throw error;
};
```

#### createService (linha 467-482)
```typescript
export const createService = async (service: Service): Promise<Service> => {
  const user_id = await getCurrentUserId();
  const newId = await getNextId('servicos');
  const code = newId;

  const { data, error } = await supabase.from('servicos').insert({
    id: newId,
    user_id,  // ADICIONAR
    codigo: code,
    nome: service.name,
    categoria: service.category,
    preco: service.price,
    tempo: service.time
  }).select().single();

  if (error) throw error;
  return mapServiceFromDB(data);
};
```

#### createTransaction (linha 522-537)
```typescript
export const createTransaction = async (transaction: Transaction): Promise<Transaction> => {
  const user_id = await getCurrentUserId();
  const newId = await getNextId('transacoes');
  const { data, error } = await supabase.from('transacoes').insert({
    id: newId,
    user_id,  // ADICIONAR
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
```

#### createGearbox (linha 564-578)
```typescript
export const createGearbox = async (engine: Gearbox): Promise<Gearbox> => {
  const user_id = await getCurrentUserId();
  const newId = await getNextId('cambios');
  const { data, error } = await supabase.from('cambios').insert({
    id: newId,
    user_id,  // ADICIONAR
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
```

#### createBrand (linha 677-687)
```typescript
export const createBrand = async (brand: import('../types').Brand): Promise<import('../types').Brand> => {
  const user_id = await getCurrentUserId();
  const newId = await getNextId('marcas');
  const { data, error } = await supabase.from('marcas').insert({
    id: newId,
    user_id,  // ADICIONAR
    nome: brand.name,
    logo_url: brand.logo
  }).select().single();

  if (error) throw error;
  return mapBrandFromDB(data);
};
```

#### uploadDocument (linha 695-741)
```typescript
export const uploadDocument = async (orderId: string, file: File, customName?: string): Promise<{ data: OrderDocument | null; error?: string }> => {
  const user_id = await getCurrentUserId();
  // ... código de upload existente ...

  const { data: docData, error: docError } = await supabase.from('order_documents').insert({
    id: newId,
    user_id,  // ADICIONAR
    order_id: orderId,
    name: customName || file.name,
    url: publicUrl,
    type: fileExt?.toUpperCase() || 'FILE'
  }).select().single();
  
  // ... resto do código ...
};
```

#### updateOrder - Checklist (linha 366-390)
```typescript
// Dentro de updateOrder, na parte de checklist:
if (updates.checklist) {
  const user_id = await getCurrentUserId();  // ADICIONAR no início da função
  
  // ... código de delete existente ...

  if (updates.checklist.length > 0) {
    const { error: insertError } = await supabase.from('itens_checklist').insert(
      updates.checklist.map(item => {
        const dbItem: any = {
          user_id,  // ADICIONAR
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
```

## Total de Mudanças

- **1 função helper adicionada**: `getCurrentUserId()`
- **12 funções modificadas** com adição de `user_id`
- **0 mudanças em UI/layout**

## Depois de Modificar o Código

1. Execute o SQL: `DATABASE_FINAL_WORKING.sql`
2. Teste o sistema
3. Verifique isolamento entre usuários
