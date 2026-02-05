import { supabase } from './supabase';
import { FiscalInvoice } from '../types';

/**
 * DB OPERATIONS
 */

export const getInvoicesByOrder = async (orderId: string): Promise<FiscalInvoice[]> => {
    const { data, error } = await supabase
        .from('notas_fiscais')
        .select('*')
        .eq('id_ordem', orderId)
        .order('criado_em', { ascending: false });

    if (error) throw error;

    return data.map(mapInvoiceFromDB);
};

export const getInvoices = async (): Promise<FiscalInvoice[]> => {
    const { data, error } = await supabase
        .from('notas_fiscais')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) throw error;

    return data.map(mapInvoiceFromDB);
};

export const createInvoiceRecord = async (invoice: Partial<FiscalInvoice>): Promise<FiscalInvoice> => {
    const { data, error } = await supabase
        .from('notas_fiscais')
        .insert({
            id_ordem: invoice.orderId,
            tipo: invoice.type,
            status: invoice.status || 'PENDING',
            id_externo: invoice.externalId,
        })
        .select()
        .single();

    if (error) throw error;
    return mapInvoiceFromDB(data);
};

export const updateInvoiceRecord = async (id: string, updates: Partial<FiscalInvoice>) => {
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.externalId) dbUpdates.id_externo = updates.externalId;
    if (updates.number) dbUpdates.numero = updates.number;
    if (updates.series) dbUpdates.serie = updates.series;
    if (updates.accessKey) dbUpdates.chave_acesso = updates.accessKey;
    if (updates.pdfUrl) dbUpdates.pdf_url = updates.pdfUrl;
    if (updates.xmlUrl) dbUpdates.xml_url = updates.xmlUrl;
    if (updates.errorMessage) dbUpdates.mensagem_erro = updates.errorMessage;

    dbUpdates.atualizado_em = new Date().toISOString();

    const { error } = await supabase
        .from('notas_fiscais')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
};

// Mapper
const mapInvoiceFromDB = (db: any): FiscalInvoice => ({
    id: db.id,
    orderId: db.id_ordem,
    externalId: db.id_externo,
    type: db.tipo,
    status: db.status,
    number: db.numero,
    series: db.serie,
    accessKey: db.chave_acesso,
    pdfUrl: db.pdf_url,
    xmlUrl: db.xml_url,
    errorMessage: db.mensagem_erro,
    createdAt: db.criado_em,
    updatedAt: db.atualizado_em
});

/**
 * PLUGNOTAS API INTEGRATION (Client-Side Proxy / Placeholder)
 * In production, these should be called via Supabase functions to hide API Keys.
 */

// Mock Headers
const API_KEY = import.meta.env.VITE_PLUGNOTAS_API_KEY || ''; // Needs to be added to .env
const BASE_URL = 'https://api.sandbox.plugnotas.com.br'; // Sandbox logic

// Helper to determine CFOP based on state
const getCfop = (rule: any, isInterstate: boolean) => {
    return isInterstate ? rule.cfop_interstate : rule.cfop_state;
};

export const prepareNFePayload = async (orderId: string) => {
    // 1. Fetch Order with Items and Client
    // note: we need to join with vehicles/clients/items. 
    // Since we don't have simplified joins here easily without foreign keys in every direction or specialized views,
    // we might need to do multiple fetches or use a unified query if relations exist.
    // Assuming we can get the order and then fetch items/client.

    const { data: order, error: orderError } = await supabase
        .from('workshop_orders')
        .select('*')
        .eq('id', orderId)
        .single();
    if (orderError) throw orderError;

    // Fetch Client (via Vehicle normally, but let's assume we can get it or we need to look up vehicle first)
    const { data: vehicle } = await supabase.from('vehicles').select('clientId').eq('id', order.vehicleId).single();
    const { data: client } = await supabase.from('clients').select('*').eq('id', vehicle.clientId).single();

    // Fetch Emitter Settings
    const { data: settings } = await supabase.from('fiscal_settings').select('*').single();

    // Fetch Items with Product Details (Inventory) to get NCM/TaxRule
    // Order items jsonb usually stores snapshot. We might need to look up the inventory item to get current fiscal data
    // OR fiscal data should have been snapshotted. For now, look up current inventory data.

    // We'll iterate the order items from the JSONB
    const itemsPayload = [];
    let totalProd = 0;

    for (const item of order.items) {
        if (item.type === 'SERVICE') continue; // Services usually go to NFS-e, skipping for NFe or handling as products depending on city. Assuming NFe = Products only for now.

        // Find product in inventory to get Fiscal IDs
        // item.id might be the product id if we stored it, or we need to match by code/name?
        // usually order.items has { id: productId, ... }
        const { data: product } = await supabase.from('itens_estoque').select('*').eq('id', item.id).single();

        if (!product) continue;

        // Fetch Tax Rule
        let taxRule = null;
        if (product.tax_rule_id) {
            const { data: tr } = await supabase.from('fiscal_tax_rules').select('*').eq('id', product.tax_rule_id).single();
            taxRule = tr;
        }

        // Fetch NCM
        let ncm = null;
        if (product.ncm_code) {
            const { data: n } = await supabase.from('fiscal_ncm').select('*').eq('code', product.ncm_code).single();
            ncm = n;
        }

        const isInterstate = false; // TODO: Compare client state with emitter state
        const cfop = taxRule ? getCfop(taxRule, isInterstate) : '5102'; // Default fallback

        itemsPayload.push({
            codigo: product.code,
            descricao: item.description,
            ncm: product.ncm_code || '00000000',
            cest: product.cest,
            cfop: cfop,
            valorUnitario: item.price,
            quantidade: item.quantity,
            valorTotal: item.price * item.quantity,
            tributos: {
                icms: {
                    origem: product.origin || 0,
                    csosn: taxRule?.csosn || '102',
                    cst: taxRule?.cst_icms,
                    aliquota: taxRule?.icms_rate || 0
                },
                pis: {
                    cst: taxRule?.cst_pis_cofins || '99',
                    aliquota: taxRule?.pis_rate || 0
                },
                cofins: {
                    cst: taxRule?.cst_pis_cofins || '99',
                    aliquota: taxRule?.cofins_rate || 0
                },
                ibs: {
                    cst: taxRule?.cst_ibs,
                    aliquota: taxRule?.ibs_rate
                },
                cbs: {
                    cst: taxRule?.cst_cbs,
                    aliquota: taxRule?.cbs_rate
                }
            }
        });
        totalProd += (item.price * item.quantity);
    }

    return {
        idIntegracao: orderId,
        presencaConsumidor: '1', // 1 - Presencial
        naturezaOperacao: 'Venda de Mercadorias', // Should come from CFOP desc or general setting
        destinatario: {
            cpfCnpj: client.cpf.replace(/\D/g, ''),
            razaoSocial: client.name,
            email: client.email,
            endereco: {
                logradouro: client.address,
                numero: client.addressNumber || 'S/N',
                bairro: client.neighborhood,
                codigoCidade: '3550308', // TODO: Need IBGE code in Client/Settings
                descricaoCidade: client.city,
                estado: client.state,
                cep: client.zipCode
            }
        },
        itens: itemsPayload,
        pagamentos: [
            {
                forma: 'DINHEIRO', // TODO: Map from order payments
                valor: totalProd
            }
        ]
    };
};

export const emitNFe = async (orderId: string) => {
    try {
        console.log("Preparing NFe Payload for Order:", orderId);
        const payload = await prepareNFePayload(orderId);
        console.log("Generated Payload:", payload);

        // 1. Create DB Record
        await createInvoiceRecord({
            orderId: orderId,
            type: 'NFE',
            status: 'PROCESSING',
            externalId: 'pending-' + Date.now()
        });

        // 2. Call API (Simulated)
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ id: 'plug-' + Date.now(), status: 'PROCESSING', payload });
            }, 1000);
        });

    } catch (err) {
        console.error("Error emitting NFe:", err);
        throw err;
    }
};
