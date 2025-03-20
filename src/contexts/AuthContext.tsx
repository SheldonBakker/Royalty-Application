import { createContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User, AuthResponse, Factor, AuthenticatorAssuranceLevels, AMREntry } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null, mfaRequired?: boolean }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null, data: AuthResponse['data'] | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
  // MFA methods
  enrollMFA: () => Promise<{ error: Error | null, data: { id: string, qr: string } | null }>;
  challengeMFA: (factorId: string) => Promise<{ error: Error | null, data: { id: string } | null }>;
  verifyMFA: (factorId: string, challengeId: string, code: string) => Promise<{ error: Error | null, data: unknown | null }>;
  listMFAFactors: () => Promise<{ error: Error | null, data: { totp: Factor[] } | null }>;
  getAuthenticatorAssuranceLevel: () => Promise<{ 
    error: Error | null,
    data: { 
      currentLevel: AuthenticatorAssuranceLevels | null, 
      nextLevel: AuthenticatorAssuranceLevels | null,
      currentAuthenticationMethods: AMREntry[]
    } | null 
  }>;
  unenrollMFA: (factorId: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext }; // Export AuthContext

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Add refs to track component mount state and ongoing operations
  const isMounted = useRef(true);
  const pendingOperations = useRef<AbortController[]>([]);

  // Helper to register pending operations
  const registerOperation = () => {
    const controller = new AbortController();
    pendingOperations.current.push(controller);
    return { 
      signal: controller.signal, 
      complete: () => {
        pendingOperations.current = pendingOperations.current.filter(c => c !== controller);
      }
    };
  };

  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;
    
    // Get session on initial load with proper cleanup
    const initAuth = async () => {
      try {
        // Register this operation to be able to abort if needed
        const operation = registerOperation();
        
        // Get initial session
        const { data: sessionData } = await supabase.auth.getSession();
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setSession(sessionData.session);
          setUser(sessionData.session?.user ?? null);
          setLoading(false);
        }
        
        // Set up auth state change listener
        if (isMounted.current) {
          const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isMounted.current) {
              setSession(session);
              setUser(session?.user ?? null);
              setLoading(false);
            }
          });
          
          authSubscription = data.subscription;
        }
        
        // Mark operation as complete
        operation.complete();
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    initAuth();

    // Cleanup function
    return () => {
      isMounted.current = false;
      
      // Cancel any pending operations
      pendingOperations.current.forEach(controller => {
        try {
          controller.abort();
        } catch (e) {
          console.error('Error aborting operation:', e);
        }
      });
      
      // Unsubscribe from auth changes
      if (authSubscription) {
        try {
          authSubscription.unsubscribe();
        } catch (e) {
          console.error('Error unsubscribing from auth:', e);
        }
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const operation = registerOperation();
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        operation.complete();
        return { error };
      }
      
      // Check if MFA is required
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      operation.complete();
      
      if (mfaError) {
        return { error: mfaError };
      }
      
      // If the user has MFA enabled and needs to verify
      if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel === 'aal1') {
        return { error: null, mfaRequired: true };
      }
      
      return { error: null };
    } catch (err) {
      // Handle AbortError separately to prevent showing errors for intentional cancellations
      if (err instanceof Error && err.name === 'AbortError') {
        return { error: new Error('Authentication was cancelled') };
      }
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const operation = registerOperation();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      operation.complete();
      
      if (error) {
        console.error('Signup error:', error);
        return { error, data: null };
      }

      return { error: null, data };
    } catch (err) {
      // Handle AbortError separately
      if (err instanceof Error && err.name === 'AbortError') {
        return { 
          error: new Error('Signup was cancelled'),
          data: null 
        };
      }
      
      console.error('Unexpected error during signup:', err);
      return { 
        error: new Error(err instanceof Error ? err.message : 'An unexpected error occurred'),
        data: null 
      };
    }
  };

  const signOut = async () => {
    try {
      const operation = registerOperation();
      await supabase.auth.signOut();
      operation.complete();
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  };

  // MFA methods with proper signal handling
  const enrollMFA = async () => {
    try {
      const operation = registerOperation();
      
      // Generate a random identifier to make each factor unique
      const randomId = Math.random().toString(36).substring(2, 10);
      const appName = 'LoyaltyBean';
      const uniqueName = `${appName}-${randomId}`;
      
      // Enroll with the unique name
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: appName,
        friendlyName: uniqueName
      });

      operation.complete();
      
      if (error) {
        return { error, data: null };
      }

      return { 
        error: null, 
        data: { 
          id: data.id, 
          qr: data.totp.qr_code 
        } 
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { error: new Error('MFA enrollment was cancelled'), data: null };
      }
      return { error: err as Error, data: null };
    }
  };

  const challengeMFA = async (factorId: string) => {
    try {
      const operation = registerOperation();
      
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      operation.complete();
      
      if (error) {
        return { error, data: null };
      }

      return { error: null, data: { id: data.id } };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { error: new Error('MFA challenge was cancelled'), data: null };
      }
      return { error: err as Error, data: null };
    }
  };

  const verifyMFA = async (factorId: string, challengeId: string, code: string) => {
    try {
      const operation = registerOperation();
      
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      operation.complete();
      
      if (error) {
        return { error, data: null };
      }

      return { error: null, data };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { error: new Error('MFA verification was cancelled'), data: null };
      }
      return { error: err as Error, data: null };
    }
  };

  const listMFAFactors = async () => {
    try {
      const operation = registerOperation();
      
      const { data, error } = await supabase.auth.mfa.listFactors();

      operation.complete();
      
      if (error) {
        return { error, data: null };
      }

      return { error: null, data };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { error: new Error('MFA factors request was cancelled'), data: null };
      }
      return { error: err as Error, data: null };
    }
  };

  const getAuthenticatorAssuranceLevel = async () => {
    try {
      const operation = registerOperation();
      
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      operation.complete();
      
      if (error) {
        return { error, data: null };
      }

      return { error: null, data };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { error: new Error('Auth level request was cancelled'), data: null };
      }
      return { error: err as Error, data: null };
    }
  };

  const unenrollMFA = async (factorId: string) => {
    try {
      const operation = registerOperation();
      
      const { error } = await supabase.auth.mfa.unenroll({ 
        factorId 
      });
      
      operation.complete();
      
      return { error };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { error: new Error('MFA unenrollment was cancelled') };
      }
      return { error: err as Error };
    }
  };

  const value = {
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading,
    // MFA methods
    enrollMFA,
    challengeMFA,
    verifyMFA,
    listMFAFactors,
    getAuthenticatorAssuranceLevel,
    unenrollMFA
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 