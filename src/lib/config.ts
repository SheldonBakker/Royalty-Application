// Configuration file to handle environment variables
// Works with both local .env (Vite) and Cloudflare Workers environment variables

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
}

// Declare global variables that will be available in Cloudflare Workers
declare global {
  const SUPABASE_URL: string;
  const SUPABASE_ANON_KEY: string;
  const PAYSTACK_PUBLIC_KEY: string;
}

function getConfig(): EnvConfig {
  // In Cloudflare Workers environment
  if (typeof window !== 'undefined' && 'CLOUDFLARE' in window) {
    // Access environment variables from Cloudflare
    return {
      SUPABASE_URL: SUPABASE_URL || '',
      SUPABASE_ANON_KEY: SUPABASE_ANON_KEY || '',
      PAYSTACK_PUBLIC_KEY: PAYSTACK_PUBLIC_KEY || '',
    };
  }

  // In Vite/local development environment
  return {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  };
}

export const config = getConfig(); 