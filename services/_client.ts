import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase URL or Anon Key');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export const getUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id;
};

export const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
};

export const getNextId = async (table: string): Promise<string> => {
    const { data, error } = await supabase.from(table).select('id');
    if (error) {
        console.error(`Error fetching IDs for ${table}:`, error);
        return Date.now().toString();
    }
    const ids = data.map(d => parseInt(d.id, 10)).filter(n => !isNaN(n));
    const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    return String(nextId).padStart(2, '0');
};

export function mathRandomString() {
    return Math.random().toString(36).substring(2, 15);
}
