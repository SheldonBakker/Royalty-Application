// Configuration file to handle environment variables
// Works with local .env (Vite) environment variables

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
}

// Function to get environment variables
function getLocalEnv(key: string): string {
  // More safely check for import.meta.env existence
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Try to get variable from Vite's environment
    const value = import.meta.env[key];
    if (value) return value;
  }
  
  // Hardcoded fallbacks for specific keys
  // These values will be replaced during build in production
  if (key === 'VITE_SUPABASE_URL') {
    return 'https://vhcehncbwkpgckyitofa.supabase.co'; // Will be replaced in production build
  }
  if (key === 'VITE_SUPABASE_ANON_KEY') {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoY2VobmNid2twZ2NreWl0b2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0NDkxOTcsImV4cCI6MjA1ODAyNTE5N30.8THs3L9xITSqMBxEV-6cnfdFgmB3LjicO89e3J06P6Q'; // Will be replaced in production build
  }
  if (key === 'VITE_PAYSTACK_PUBLIC_KEY') {
    return 'pk_test_c704520f35f47b15fc077af290346d643c4cf92d'; // Will be replaced in production build
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
  
  // Safely check environment mode
  const envMode = typeof import.meta !== 'undefined' && import.meta.env ? 
    (import.meta.env.MODE || 'unknown') : 'production';
  
  if (debugInfo) {
    console.log('Environment mode:', envMode);
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