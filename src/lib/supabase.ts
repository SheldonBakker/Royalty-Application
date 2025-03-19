import { createClient } from '@supabase/supabase-js';

// These will need to be replaced with your actual Supabase URL and key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Client = {
  id: string;
  name: string;
  phone_number: string;
  coffees_purchased: number;
  created_at: string;
};

export type Redemption = {
  id: string;
  client_id: string;
  redemption_date: string;
  created_at: string;
};

export type Settings = {
  id: string;
  redemption_threshold: number;
  created_at: string;
}; 