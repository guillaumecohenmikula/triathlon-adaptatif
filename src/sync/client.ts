import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Client Supabase, ou null quand la synchronisation n'est pas configurée.
 * L'app doit rester pleinement utilisable dans ce cas : elle est locale d'abord,
 * la synchronisation n'est qu'un supplément.
 */
export const supabase = url && key ? createClient(url, key) : null;

export const syncConfigured = supabase !== null;
