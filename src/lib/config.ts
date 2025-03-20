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
  
  // For browser window.ENV
  interface Window {
    ENV?: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      PAYSTACK_PUBLIC_KEY: string;
    }
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
  // During build time, Vite will replace import.meta.env.VITE_* with placeholders
  // We only want to access these in development mode
  if (process.env.NODE_ENV !== 'production' && typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  return '';
}

// Simple safe check to ensure API keys aren't default placeholders
function isValidApiKey(key: string): boolean {
  return !!key && 
    !key.includes('__RUNTIME_') && 
    !key.includes('undefined') && 
    !key.includes('null') && 
    key !== 'null' && 
    key !== 'undefined' &&
    key.length > 10; // Real keys are longer than this
}

function getConfig(): EnvConfig {
  // Debug information
  const debugInfo = process.env.NODE_ENV !== 'production';
  
  if (debugInfo) {
    console.log('Environment mode:', process.env.NODE_ENV);
  }

  // Check for window.ENV first (injected by Cloudflare Worker)
  if (typeof window !== 'undefined' && window.ENV) {
    if (debugInfo) {
      console.log('Using window.ENV environment variables');
      console.log('SUPABASE_URL exists:', !!window.ENV.SUPABASE_URL);
      console.log('SUPABASE_ANON_KEY exists:', !!window.ENV.SUPABASE_ANON_KEY);
    }
    
    const keys = {
      SUPABASE_URL: window.ENV.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: window.ENV.SUPABASE_ANON_KEY || '',
      PAYSTACK_PUBLIC_KEY: window.ENV.PAYSTACK_PUBLIC_KEY || '',
    };
    
    // Only return if the keys seem valid
    if (isValidApiKey(keys.SUPABASE_URL) && isValidApiKey(keys.SUPABASE_ANON_KEY)) {
      return keys;
    }
  }
  
  // In Cloudflare Workers environment
  if (typeof window !== 'undefined' && 'CLOUDFLARE' in window) {
    if (debugInfo) {
      console.log('Using Cloudflare environment variables');
    }
    
    // First try to access environment variables from Cloudflare Secrets
    if (envSecrets) {
      if (debugInfo) {
        console.log('Using envSecrets');
        console.log('SUPABASE_URL exists:', !!envSecrets.SUPABASE_URL);
        console.log('SUPABASE_ANON_KEY exists:', !!envSecrets.SUPABASE_ANON_KEY);
      }
      
      return {
        SUPABASE_URL: envSecrets.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: envSecrets.SUPABASE_ANON_KEY || '',
        PAYSTACK_PUBLIC_KEY: envSecrets.PAYSTACK_PUBLIC_KEY || '',
      };
    }
    
    // Fallback to global variables if env is not available
    if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
      if (debugInfo) {
        console.log('Using global variables');
      }
      
      return {
        SUPABASE_URL: SUPABASE_URL || '',
        SUPABASE_ANON_KEY: SUPABASE_ANON_KEY || '',
        PAYSTACK_PUBLIC_KEY: PAYSTACK_PUBLIC_KEY || '',
      };
    }
  }

  // In Vite/local development environment
  // These values are only available in development
  if (process.env.NODE_ENV !== 'production') {
    if (debugInfo) {
      console.log('Using Vite environment variables');
      console.log('VITE_SUPABASE_URL:', getLocalEnv('VITE_SUPABASE_URL').substring(0, 5) + '...');
      console.log('VITE_SUPABASE_ANON_KEY exists:', !!getLocalEnv('VITE_SUPABASE_ANON_KEY'));
    }
    
    const localUrl = getLocalEnv('VITE_SUPABASE_URL');
    const localKey = getLocalEnv('VITE_SUPABASE_ANON_KEY');
    
    return {
      SUPABASE_URL: localUrl,
      SUPABASE_ANON_KEY: localKey,
      PAYSTACK_PUBLIC_KEY: getLocalEnv('VITE_PAYSTACK_PUBLIC_KEY'),
    };
  }
  
  // Fallback to empty strings if nothing else works
  // This should never happen in production as the values should be 
  // injected by the Cloudflare Worker
  console.error('No environment variables found! Application will not work correctly.');
  
  // Use development values if available (not recommended for production)
  // This is just to prevent immediate crashes during testing
  const fallbackUrl = 'https://yourproject.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXJwcm9qZWN0IiwicmN0IjoiYW5vbiIsImV4cCI6OTk5OX0.placeholder';
  
  if (debugInfo) {
    console.log('Using fallback values (not secure for production)');
  }
  
  return {
    SUPABASE_URL: fallbackUrl,
    SUPABASE_ANON_KEY: fallbackKey,
    PAYSTACK_PUBLIC_KEY: '',
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