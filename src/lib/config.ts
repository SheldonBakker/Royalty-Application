// Configuration file to handle environment variables
// Works with local .env (Vite) environment variables

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
}

// Function to get environment variables
function getLocalEnv(key: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  return '';
}

// Simple safe check to ensure API keys aren't default placeholders
function isValidApiKey(key: string): boolean {
  return !!key && 
    !key.includes('undefined') && 
    !key.includes('null') && 
    key !== 'null' && 
    key !== 'undefined' &&
    key.length > 10; // Real keys are longer than this
}

function getConfig(): EnvConfig {
  // Debug information
  const debugInfo = false; // Changed to false to disable logs
  
  if (debugInfo) {
    console.log('Environment mode:', process.env.NODE_ENV);
    console.log('VITE_SUPABASE_URL:', getLocalEnv('VITE_SUPABASE_URL').substring(0, 5) + '...');
    console.log('VITE_SUPABASE_ANON_KEY exists:', !!getLocalEnv('VITE_SUPABASE_ANON_KEY'));
  }
  
  const localUrl = getLocalEnv('VITE_SUPABASE_URL');
  const localKey = getLocalEnv('VITE_SUPABASE_ANON_KEY');
  const paystackKey = getLocalEnv('VITE_PAYSTACK_PUBLIC_KEY');
  
  if (!isValidApiKey(localUrl) || !isValidApiKey(localKey)) {
    console.error('Missing or invalid environment variables! Application will not work correctly.');
    console.error('Please check your .env file for valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.');
  }
  
  return {
    SUPABASE_URL: localUrl,
    SUPABASE_ANON_KEY: localKey,
    PAYSTACK_PUBLIC_KEY: paystackKey,
  };
}

// Export a function that gets config at runtime instead of a static object
// This ensures values are fetched when needed rather than at build time
let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = getConfig();
  }
  return cachedConfig;
}

export const config = getEnvConfig(); 