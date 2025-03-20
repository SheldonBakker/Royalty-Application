import { createClient } from '@supabase/supabase-js';
import { getEnvConfig } from './config';

// Get config values dynamically at runtime rather than build time
const getSupabaseConfig = () => {
  const config = getEnvConfig();
  return {
    supabaseUrl: config.SUPABASE_URL,
    supabaseAnonKey: config.SUPABASE_ANON_KEY
  };
};

// Create a function to get the Supabase client to ensure credentials are loaded at runtime
export function getSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

// Export a client instance for backward compatibility, but this will now get credentials at runtime
export const supabase = getSupabaseClient();

export type Client = {
  id: string;
  name: string;
  phone_number: string;
  coffees_purchased: number;
  created_at: string;
  user_id: string;
};

export type Redemption = {
  id: string;
  client_id: string;
  redemption_date: string;
  created_at: string;
  user_id: string;
};

export type Settings = {
  id: string;
  redemption_threshold: number;
  created_at: string;
  user_id?: string;
  total_coffees_purchased?: number;
  last_reset_date?: string;
  has_paid?: boolean;
  credit_balance?: number;
};

export type PaymentTransaction = {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  created_at: string;
  payment_provider: string;
  provider_reference?: string;
}; 