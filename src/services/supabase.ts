import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabaseInitError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    : null

let supabaseClient: SupabaseClient | null = null

export async function getSupabase(): Promise<SupabaseClient | null> {
  if (supabaseClient) return supabaseClient
  if (supabaseInitError) return null

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  })

  return supabaseClient
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient
}