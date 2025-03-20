import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Use the config values instead of directly accessing environment variables
const supabaseUrl = config.SUPABASE_URL;
const supabaseAnonKey = config.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

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