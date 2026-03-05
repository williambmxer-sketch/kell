/// <reference types="vite/client" />
/**
 * services/supabase.ts — Barrel de Re-exports
 *
 * Este arquivo mantém as mesmas exportações de sempre para compatibilidade total.
 * A lógica foi organizada em sub-arquivos por domínio:
 *   _client.ts    → Supabase client, auth, utilitários
 *   _mappers.ts   → Mappers DB ↔ tipos da aplicação
 *   _orders.ts    → Ordens de Serviço, histórico, documentos
 *   _clients.ts   → Clientes e veículos
 *   _inventory.ts → Estoque, serviços, câmbios
 *   _finance.ts   → Transações, marcas, formas de pagamento
 *   _settings.ts  → Usuários, configurações, logo
 */

export { supabase, getUserId, getSession, getNextId, mathRandomString, signIn, signOut, updatePassword } from './_client';
export { fetchOrders, createOrder, updateOrder, deleteOrder, addOrderItem, updateOrderItem, deleteOrderItem, fetchHistory, addHistory, uploadDocument, deleteDocument } from './_orders';
export { fetchClients, createClient, updateClient, deleteClient, fetchVehicles, createVehicle, updateVehicle, deleteVehicle } from './_clients';
export { fetchInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, fetchServices, createService, updateService, deleteService, fetchGearboxes, createGearbox, updateGearbox, deleteGearbox } from './_inventory';
export { fetchTransactions, createTransaction, deleteTransaction, fetchBrands, createBrand, deleteBrand, fetchPaymentMethods, createPaymentMethod, togglePaymentMethod, deletePaymentMethod } from './_finance';
export { fetchUsers, createUser, updateUser, deleteUser, fetchSettings, updateSettings, uploadLogo } from './_settings';
