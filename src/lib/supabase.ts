import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Single isomorphic Supabase client (works at build time for content reads and
 * in the browser for the contact-form insert). The anon key is public by
 * design — access is gated by Row-Level Security (see supabase/schema.sql).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anon as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
