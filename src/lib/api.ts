import { supabase } from './supabase';
import type { Client, Redemption, Settings } from './supabase';

// Client API functions
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return data as Client[];
}

export async function getClientByPhone(phoneNumber: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is the error code for no rows returned
  return data as Client | null;
}

export async function getClientById(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data as Client;
}

export async function createClient(client: Omit<Client, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('clients')
    .insert([{ ...client, coffees_purchased: 0 }])
    .select()
    .single();
    
  if (error) throw error;
  return data as Client;
}

export async function updateClient(id: string, updates: Partial<Omit<Client, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
}

export async function addCoffee(id: string) {
  const client = await getClientById(id);
  const updatedCount = (client.coffees_purchased || 0) + 1;
  
  return updateClient(id, { coffees_purchased: updatedCount });
}

// Redemption API functions
export async function getRedemptions(clientId?: string) {
  let query = supabase
    .from('redemptions')
    .select('*, clients(name, phone_number)')
    .order('redemption_date', { ascending: false });
    
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as (Redemption & { clients: Pick<Client, 'name' | 'phone_number'> })[];
}

export async function createRedemption(clientId: string) {
  const client = await getClientById(clientId);
  const settings = await getSettings();
  
  if (client.coffees_purchased < settings.redemption_threshold) {
    throw new Error(`Client needs ${settings.redemption_threshold} coffees to redeem. Currently has ${client.coffees_purchased}.`);
  }
  
  const { data: redemption, error: redemptionError } = await supabase
    .from('redemptions')
    .insert([{ 
      client_id: clientId,
      redemption_date: new Date().toISOString()
    }])
    .select()
    .single();
    
  if (redemptionError) throw redemptionError;
  
  // Reset the coffees_purchased counter
  await updateClient(clientId, { coffees_purchased: 0 });
  
  return redemption as Redemption;
}

// Settings API functions
export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single();
    
  if (error) {
    // If settings don't exist, create default settings
    if (error.code === 'PGRST116') {
      return createDefaultSettings();
    }
    throw error;
  }
  
  return data as Settings;
}

export async function updateSettings(updates: Partial<Omit<Settings, 'id' | 'created_at'>>) {
  const settings = await getSettings();
  
  const { data, error } = await supabase
    .from('settings')
    .update(updates)
    .eq('id', settings.id)
    .select()
    .single();
    
  if (error) throw error;
  return data as Settings;
}

async function createDefaultSettings() {
  const { data, error } = await supabase
    .from('settings')
    .insert([{ redemption_threshold: 10 }])
    .select()
    .single();
    
  if (error) throw error;
  return data as Settings;
} 