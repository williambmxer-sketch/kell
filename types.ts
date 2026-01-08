export enum OSStatus {
  RECEPTION = 'RECEPTION',
  BUDGET = 'BUDGET',
  APPROVAL = 'APPROVAL',
  SCHEDULED = 'SCHEDULED',
  EXECUTION = 'EXECUTION',
  FINISHED = 'FINISHED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum VehicleCategory {
  PRIVATE = 'PRIVATE',
  COMPANY = 'COMPANY',
  RESTORATION = 'RESTORATION'
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address?: string;
  addressNumber?: string;
  city?: string;
  zipCode?: string;
  neighborhood?: string;
  state?: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  transmission?: string;
}

export interface OrderItem {
  id: string;
  type: 'PART' | 'SERVICE';
  description: string;
  quantity: number;
  price: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
}

export interface Gearbox {
  id: string;
  code: string;
  model: string;
  brand: string;
  type: string; // Ex: Automático, CVT, Manual
  specs: string;
  assemblyTime?: string; // Tempo padrão de montagem
}

export interface Service {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  time: string;
}

export interface OrderDocument {
  id: string;
  orderId: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

export interface WorkshopOrder {
  id: string;
  vehicleId: string;
  status: OSStatus;
  priority: Priority;
  category: VehicleCategory;
  km: number;
  fuelLevel?: number;
  reportedFault: string;
  diagnosis?: string;
  mechanicId?: string;
  scheduledDate?: string; // ISO date string
  estimatedDuration?: number; // In minutes
  discount?: number;
  discountType?: 'value' | 'percent';
  notes?: string;
  items: OrderItem[];
  checklist?: ChecklistItem[];
  documents?: OrderDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  supplier: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  action: string;
  diff?: string;
  timestamp: string;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'MECHANIC' | 'ADVISOR';
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'IN' | 'OUT';
  status: 'PENDING' | 'PAID';
  date: string;
  orderId?: string;
}

export interface WorkshopSettings {
  id: string;
  nome_oficina?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  logo_url?: string;
  horario_funcionamento?: Record<string, { ativo: boolean; inicio: string; fim: string }>;
  whatsappMessageTemplate?: string;
}
