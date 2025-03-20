// Configuration file to handle environment variables
// Works with both local .env (Vite) and Cloudflare Workers environment variables

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
}

// Declare global variables that will be available in Cloudflare Workers
declare global {
  // For standard environment variables
  const SUPABASE_URL: string;
  const SUPABASE_ANON_KEY: string;
  const PAYSTACK_PUBLIC_KEY: string;
  
  // For Cloudflare Secrets
  interface Env {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    PAYSTACK_PUBLIC_KEY: string;
  }
}

// Global variable to store environment access
let envSecrets: Env | null = null;

// Function to set secrets from Cloudflare Worker env parameter
export function setEnvSecrets(secrets: Env): void {
  envSecrets = secrets;
}

// Replace direct references to import.meta.env with functions that
// access these values at runtime rather than build time
function getLocalEnv(key: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  return '';
}

function getConfig(): EnvConfig {
  // In Cloudflare Workers environment
  if (typeof window !== 'undefined' && 'CLOUDFLARE' in window) {
    // First try to access environment variables from Cloudflare Secrets
    if (envSecrets) {
      return {
        SUPABASE_URL: envSecrets.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: envSecrets.SUPABASE_ANON_KEY || '',
        PAYSTACK_PUBLIC_KEY: envSecrets.PAYSTACK_PUBLIC_KEY || '',
      };
    }
    
    // Fallback to global variables if env is not available
    return {
      SUPABASE_URL: SUPABASE_URL || '',
      SUPABASE_ANON_KEY: SUPABASE_ANON_KEY || '',
      PAYSTACK_PUBLIC_KEY: PAYSTACK_PUBLIC_KEY || '',
    };
  }

  // In Vite/local development environment
  return {
    SUPABASE_URL: getLocalEnv('VITE_SUPABASE_URL'),
    SUPABASE_ANON_KEY: getLocalEnv('VITE_SUPABASE_ANON_KEY'),
    PAYSTACK_PUBLIC_KEY: getLocalEnv('VITE_PAYSTACK_PUBLIC_KEY'),
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