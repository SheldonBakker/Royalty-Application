import { createContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { getUserPaymentStatus, hasUserPaid } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface PaymentContextType {
  hasPaid: boolean;
  creditBalance: number;
  isLoadingPayment: boolean;
  showPaymentModal: boolean;
  checkPaymentStatus: () => Promise<void>;
  refreshPaymentStatus: () => Promise<void>;
  openPaymentModal: () => void;
  closePaymentModal: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [hasPaid, setHasPaid] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [isLoadingPayment, setIsLoadingPayment] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCheckingRef = useRef(false);
  const lastCheckTimeRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheTimeRef = useRef(0);
  // Increase cache validity to 2 minutes to reduce frequent checks
  const cacheValidityMs = 120000; // Cache valid for 2 minutes

  // Function to check and update payment status
  const checkPaymentStatus = useCallback(async (forceRefresh = false) => {
    // Don't proceed if already checking or if auth is loading
    if (isCheckingRef.current || !user || authLoading) {
      if (!user || authLoading) {
        setIsLoadingPayment(false);
      }
      return;
    }

    // Check if we can use cached data
    const now = Date.now();
    if (!forceRefresh && now - cacheTimeRef.current < cacheValidityMs) {
      // Cache is valid, do nothing and ensure loading state is off
      setIsLoadingPayment(false);
      return;
    }
    
    // Increase debounce time - don't check more than once every 5 seconds
    if (now - lastCheckTimeRef.current < 5000) {
      return;
    }
    
    // Set flag and update last check time
    isCheckingRef.current = true;
    lastCheckTimeRef.current = now;

    try {
      // Cancel any existing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create a new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      setIsLoadingPayment(true);
      
      // Get payment status directly
      const isPaid = await hasUserPaid();
      const paymentStatus = await getUserPaymentStatus();
      
      // Update state
      setHasPaid(isPaid);
      setCreditBalance(paymentStatus.credit_balance || 0);
      
      // If payment is now valid, close the payment modal if it was open
      if (isPaid || (paymentStatus.credit_balance && paymentStatus.credit_balance >= 200)) {
        setShowPaymentModal(false);
      }
      
      // Update cache time
      cacheTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Don't update hasPaid if there's an error - keep previous value to prevent unnecessary redirects
    } finally {
      setIsLoadingPayment(false);
      abortControllerRef.current = null;
      isCheckingRef.current = false;
    }
  }, [user, authLoading]);

  // Refresh payment status with debouncing
  const refreshPaymentStatus = useCallback(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Create a new promise to return
    return new Promise<void>((resolve) => {
      // Set a new timer
      debounceTimerRef.current = setTimeout(async () => {
        await checkPaymentStatus(true); // Force refresh
        resolve();
      }, 500); // Increase debounce time to 500ms
    });
  }, [checkPaymentStatus]);

  // Functions to control payment modal visibility
  const openPaymentModal = useCallback(() => {
    setShowPaymentModal(true);
  }, []);

  const closePaymentModal = useCallback(async () => {
    // Always close the modal immediately without checking payment status
    setShowPaymentModal(false);
  }, []);

  // Check payment status on auth changes, with reduced frequency
  useEffect(() => {
    let isMounted = true;
    
    if (!authLoading && user) {
      // Use setTimeout to stagger the initial check and prevent rapid state changes
      const timer = setTimeout(() => {
        if (isMounted) {
          checkPaymentStatus();
          // Note: We've removed the auto-popup of payment modal here
          // This is now managed by ProtectedRouteWithPayment based on current route
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
        isMounted = false;
      };
    } else if (!user) {
      // Reset state when user is not logged in
      setHasPaid(false);
      setCreditBalance(0);
      setIsLoadingPayment(false);
      setShowPaymentModal(false);
    }
  }, [user, authLoading, checkPaymentStatus]);
  
  // Cleanup function to abort any in-progress requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const value = {
    hasPaid,
    creditBalance,
    isLoadingPayment,
    showPaymentModal,
    checkPaymentStatus: () => checkPaymentStatus(false),
    refreshPaymentStatus,
    openPaymentModal,
    closePaymentModal
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export { PaymentContext }; 