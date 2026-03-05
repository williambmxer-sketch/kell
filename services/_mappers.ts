import { Client, Vehicle, WorkshopOrder, InventoryItem, User, Transaction, Gearbox, Service, OSStatus, Priority, VehicleCategory, OrderHistory, WorkshopSettings, Brand, PaymentMethod, OrderDocument } from '../types';

export const mapUserFromDB = (u: any): User => ({
    id: u.id,
    name: u.nome,
    role: u.papel
});

export const mapClientFromDB = (c: any): Client => ({
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

export const mapVehicleFromDB = (v: any): Vehicle => ({
    id: v.id,
    clientId: v.id_cliente,
    plate: v.placa,
    model: v.modelo,
    brand: v.marca,
    year: v.ano,
    color: v.cor
});

export const mapServiceFromDB = (s: any): Service => ({
    id: s.id,
    code: s.codigo,
    name: s.nome,
    category: s.categoria,
    price: Number(s.preco),
    time: s.tempo
});

export const mapInventoryItemFromDB = (i: any): InventoryItem => ({
    id: i.id,
    code: i.codigo,
    name: i.nome,
    supplier: i.fornecedor,
    costPrice: Number(i.preco_custo),
    salePrice: Number(i.preco_venda),
    stock: i.estoque,
    minStock: i.estoque_minimo
});

export const mapOrderFromDB = (o: any, items: any[] = [], checklist: any[] = []): WorkshopOrder => ({
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
        price: Number(i.preco),
        waitingForParts: i.waiting_parts,
        expectedArrival: i.expected_arrival
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

export const mapHistoryFromDB = (h: any): OrderHistory => ({
    id: h.id,
    orderId: h.id_ordem,
    action: h.acao,
    diff: h.diff || undefined,
    timestamp: h.data_hora,
    userId: h.id_usuario || 'admin'
});

export const mapTransactionFromDB = (db: any): Transaction => ({
    id: db.id,
    description: db.descricao,
    category: db.categoria,
    amount: Number(db.valor),
    type: db.tipo,
    status: db.status,
    date: db.data,
    orderId: db.id_ordem,
    paymentMethod: db.forma_pagamento
});

export const mapGearboxFromDB = (db: any): Gearbox => ({
    id: db.id,
    code: db.codigo,
    model: db.modelo,
    brand: db.marca,
    type: db.tipo,
    specs: db.specs,
    assemblyTime: db.tempo_montagem
});

export const mapBrandFromDB = (b: any): Brand => ({
    id: b.id,
    name: b.nome,
    logo: b.logo_url
});

export const mapPaymentMethodFromDB = (pm: any): PaymentMethod => ({
    id: pm.id,
    name: pm.name,
    active: pm.active
});

export const mapSettingsFromDB = (data: any): WorkshopSettings => ({
    ...data,
    whatsappMessageTemplate: data.whatsapp_message_template,
    authTermTemplate: data.auth_term_template,
    theme: data.tema,
    sidebarMode: data.modo_barra_lateral
});
