import { User, WorkshopSettings } from '../types';
import { supabase, getNextId, getUserId } from './_client';
import { mapUserFromDB, mapSettingsFromDB } from './_mappers';

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

// SETTINGS
export const fetchSettings = async (): Promise<WorkshopSettings | null> => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: globalData } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('id', '01')
        .maybeSingle();

    if (globalData && globalData.nome_oficina && globalData.nome_oficina !== 'Oficina Master Pro') {
        return mapSettingsFromDB(globalData);
    }

    if (user) {
        const { data: userData } = await supabase
            .from('configuracoes')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (userData) return mapSettingsFromDB(userData);
    }

    if (!user && (!globalData || globalData.nome_oficina === 'Oficina Master Pro')) {
        const { data: anyData } = await supabase.from('configuracoes').select('*').limit(1).maybeSingle();
        if (anyData) return mapSettingsFromDB(anyData);
    }

    if (!globalData) return null;
    return mapSettingsFromDB(globalData);
};

export const updateSettings = async (settings: Partial<WorkshopSettings>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbPayload: any = { id: '01', user_id: user.id };

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
    if (settings.authTermTemplate !== undefined) dbPayload.auth_term_template = settings.authTermTemplate;
    if (settings.theme !== undefined) dbPayload.tema = settings.theme;
    if (settings.sidebarMode !== undefined) dbPayload.modo_barra_lateral = settings.sidebarMode;

    const { error } = await supabase.from('configuracoes').upsert(dbPayload);
    if (error) throw error;
};

export const uploadLogo = async (file: File): Promise<{ url: string | null; error?: string }> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${fileExt}`;

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
