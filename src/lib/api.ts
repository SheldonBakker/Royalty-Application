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

export async function createClient(client: Omit<Client, 'id' | 'created_at' | 'user_id'>) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('clients')
    .insert([{ 
      ...client, 
      coffees_purchased: 0,
      user_id: userId 
    }])
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
  try {
    // Get client and settings in parallel to save time
    const [client, settings] = await Promise.all([
      getClientById(id),
      getSettings()
    ]);
    
    // Check if we have credit balance
    if ((settings.credit_balance ?? 0) < 2.5) {
      const currentBalance = settings.credit_balance ?? 0;
      throw new Error(`Insufficient credit balance. You have R${currentBalance.toFixed(2)}. Please add more credit to continue.`);
    }
    
    // Prepare updates
    const updatedCount = (client.coffees_purchased || 0) + 1;
    const needsReset = checkIfMonthlyResetNeeded(settings.last_reset_date);
    const newCreditBalance = Math.max(0, (settings.credit_balance ?? 0) - 2.5);
    
    // Prepare settings update
    const settingsUpdate: Partial<Omit<Settings, 'id' | 'created_at'>> = {
      credit_balance: newCreditBalance
    };
    
    // Add monthly counter reset if needed
    if (needsReset) {
      settingsUpdate.total_coffees_purchased = 1;
      settingsUpdate.last_reset_date = new Date().toISOString();
    } else {
      settingsUpdate.total_coffees_purchased = (settings.total_coffees_purchased || 0) + 1;
    }
    
    // Run client and settings updates in parallel
    const [updatedClient] = await Promise.all([
      updateClient(id, { coffees_purchased: updatedCount }),
      updateSettings(settingsUpdate)
    ]);
    
    return updatedClient;
  } catch (error) {
    console.error('Error in addUnit:', error);
    throw error;
  }
}

// Helper function to check if the monthly counter should be reset
function checkIfMonthlyResetNeeded(lastResetDate?: string): boolean {
  if (!lastResetDate) return true; // No reset date means we should reset
  
  const now = new Date();
  const lastReset = new Date(lastResetDate);
  
  // Reset if we're in a different month than the last reset
  return now.getMonth() !== lastReset.getMonth() || 
         now.getFullYear() !== lastReset.getFullYear();
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
  try {
    // Get client and settings in parallel
    const [client, settings] = await Promise.all([
      getClientById(clientId),
      getSettings()
    ]);
    
    // Get user data
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    if (client.coffees_purchased < settings.redemption_threshold) {
      throw new Error(`Client needs ${settings.redemption_threshold} units to redeem. Currently has ${client.coffees_purchased}.`);
    }
    
    // Create redemption record and reset coffee count in parallel
    const [redemptionResult] = await Promise.all([
      supabase
        .from('redemptions')
        .insert([{ 
          client_id: clientId,
          redemption_date: new Date().toISOString(),
          user_id: userId
        }])
        .select()
        .single(),
      // Reset the coffee counter in parallel
      updateClient(clientId, { coffees_purchased: 0 })
    ]);
    
    if (redemptionResult.error) throw redemptionResult.error;
    return redemptionResult.data as Redemption;
  } catch (error) {
    console.error('Error in createRedemption:', error);
    throw error;
  }
}

// Settings API functions
export async function getSettings() {
  try {
    // The RPC function doesn't return credit_balance, so always use direct method
    return getLegacySettings();
  } catch (err) {
    console.error('Error in getSettings:', err);
    throw err;
  }
}

// More efficient settings retrieval
async function getLegacySettings() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  
  if (!userId) {
    throw new Error('Not authenticated');
  }

  // Get existing settings directly with user_id
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  // Only handle real errors, not the "no rows returned" error
  if (error && error.code !== 'PGRST116') throw error;
  
  // If settings exist, return them
  if (data) {
    return data as Settings;
  }
  
  // Otherwise insert new settings with the user ID
  const { data: newData, error: insertError } = await supabase
    .from('settings')
    .insert({
      redemption_threshold: 10,
      credit_balance: 0,
      has_paid: false,
      user_id: userId
    })
    .select()
    .single();
    
  if (insertError) throw insertError;
  return newData as Settings;
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

// Payment API functions
export async function getUserPaymentStatus() {
  try {
    // Direct method is more reliable, skip RPC calls
    return getPaymentStatusFallback();
  } catch (err) {
    console.warn('Error in getUserPaymentStatus:', err);
    throw err;
  }
}

// Modify hasUserPaid to be simpler and more reliable
export async function hasUserPaid() {
  try {
    // Just use the direct method to check payment status
    const status = await getPaymentStatusFallback();
    
    // A user is considered "paid" if:
    // 1. has_paid flag is explicitly true OR
    // 2. They have sufficient credit balance (≥ 200)
    const hasSufficientCredit = status.credit_balance !== null && 
                               status.credit_balance !== undefined && 
                               status.credit_balance >= 200;
    
    // More detailed debug payment status to help troubleshoot
    console.log('===== PAYMENT STATUS CHECK =====');
    console.log('Raw status data:', status);
    console.log('Credit balance type:', typeof status.credit_balance);
    console.log('Credit balance value:', status.credit_balance);
    console.log('has_paid flag type:', typeof status.has_paid);
    console.log('has_paid flag value:', status.has_paid);
    console.log('hasSufficientCredit calculation:', {
      isNull: status.credit_balance === null,
      isUndefined: status.credit_balance === undefined,
      isAtLeast200: status.credit_balance >= 200,
      result: hasSufficientCredit
    });
    console.log('Final result (has_paid || hasSufficientCredit):', status.has_paid || hasSufficientCredit);
    console.log('===============================');
    
    return status.has_paid || hasSufficientCredit;
  } catch (err) {
    console.warn('Error checking if user has paid:', err);
    return false; // Default to not paid in case of error
  }
}

// Fallback method for getting payment status
async function getPaymentStatusFallback() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  
  if (!userId) {
    throw new Error('Not authenticated');
  }
  
  // Get settings with payment info
  const { data, error } = await supabase
    .from('settings')
    .select('id, credit_balance, has_paid')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  if (data) {
    // Ensure credit_balance is a number
    const creditBalance = typeof data.credit_balance === 'number' ? data.credit_balance : 0;
    
    // Check and update has_paid status based on credit balance
    if (creditBalance >= 200 && !data.has_paid) {
      // Update the has_paid flag in the database
      try {
        await supabase
          .from('settings')
          .update({ has_paid: true })
          .eq('id', data.id);
        
        console.log('Updated has_paid flag to true based on credit balance');
        return { ...data, has_paid: true, credit_balance: creditBalance };
      } catch (updateErr) {
        console.error('Failed to update has_paid flag:', updateErr);
        // Return with the corrected flag even if the database update failed
        return { ...data, has_paid: true, credit_balance: creditBalance };
      }
    }
    
    // Return data with normalized credit_balance
    return { ...data, credit_balance: creditBalance };
  }
  
  // Create new settings with payment fields
  const { data: newData, error: insertError } = await supabase
    .from('settings')
    .insert({
      redemption_threshold: 10,
      has_paid: false,
      credit_balance: 0,
      user_id: userId
    })
    .select()
    .single();
  
  if (insertError) throw insertError;
  return newData;
}

// Create a payment transaction record
export async function createPaymentTransaction(amount: number, provider: string = 'paystack') {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  // Generate a unique reference
  const reference = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert({
      user_id: userId,
      amount,
      status: 'pending',
      reference,
      payment_provider: provider
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Complete a payment transaction and add credit
export async function completePaymentTransaction(reference: string, providerReference: string) {
  try {
    // Get the transaction
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('reference', reference)
      .single();
    
    if (error) throw error;
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status === 'completed') return transaction;
    
    // Try to use RPC function to add credit with correct parameters
    const { data: result, error: rpcError } = await supabase.rpc(
      'add_user_credit', 
      { 
        p_reference: reference,
        p_provider_reference: providerReference
      }
    );
    
    if (rpcError) {
      console.warn('RPC function failed, falling back to direct method:', rpcError);
      
      // Update transaction status
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          provider_reference: providerReference
        })
        .eq('id', transaction.id);
      
      if (updateError) {
        console.error('Error updating transaction:', updateError);
        throw updateError;
      }
      
      // Get user settings
      const settings = await getUserPaymentStatus();
      
      if (!settings || !settings.id) {
        throw new Error('Could not retrieve user settings');
      }
      
      // Update settings with new credit
      const { error: settingsError } = await supabase
        .from('settings')
        .update({ 
          credit_balance: (settings.credit_balance || 0) + transaction.amount,
          has_paid: ((settings.credit_balance || 0) + transaction.amount) >= 200
        })
        .eq('id', settings.id);
      
      if (settingsError) {
        console.error('Error updating settings:', settingsError);
        throw settingsError;
      }
      
      return { ...transaction, status: 'completed' };
    }
    
    return result;
  } catch (err) {
    console.error('Error completing transaction:', err);
    throw err;
  }
}

// Get total amount paid by user
export async function getTotalAmountPaid() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      throw new Error('Not authenticated');
    }
    
    // Get the sum of all completed transactions
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');
      
    if (error) throw error;
    
    // Calculate the total amount
    const totalPaid = data.reduce((sum, transaction) => sum + transaction.amount, 0);
    return totalPaid;
  } catch (err) {
    console.error('Error getting total paid amount:', err);
    return 0;
  }
}

export async function getCreditBalance(): Promise<number> {
  const { data, error } = await supabase
    .from('settings')
    .select('credit_balance')
    .single();

  if (error) {
    throw error;
  }

  return data?.credit_balance ?? 0;
} 