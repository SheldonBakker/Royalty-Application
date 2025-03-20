import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePaystackPayment } from 'react-paystack';
import { useAuth } from '../hooks/useAuth';
import { usePayment } from '../hooks/usePayment';
import { toast } from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme';
import { completePaymentTransaction, createPaymentTransaction } from '../lib/api';
import { getEnvConfig } from '../lib/config';

// Simple type for Paystack response
interface PaystackResponse {
  reference: string;
  // We're using Record<string, unknown> instead of any for better type safety
  [key: string]: string | number | boolean | Record<string, unknown> | null;
}

// Update component props
type PaymentProps = {
  onClose?: () => void;
  onSuccess?: () => void;
};

// Add a component to display debug information
const DebugInfo = ({ creditBalance, hasPaid }: { creditBalance: number, hasPaid: boolean }) => {
  const [showDebug, setShowDebug] = useState(false);
  const location = useLocation();
  
  // Check if current page is exempt from payment verification
  const isExemptPage = () => {
    const exemptPaths = ['/settings', '/about'];
    return exemptPaths.some(path => location.pathname === path);
  };

  return (
    <div className="mt-6 text-center">
      <button 
        onClick={() => setShowDebug(!showDebug)}
        className="text-xs text-gray-500 underline"
      >
        {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
      </button>
      
      {showDebug && (
        <div className="mt-2 p-3 bg-gray-100 rounded-md text-left text-xs">
          <p><strong>Credit Balance:</strong> R{creditBalance.toFixed(2)}</p>
          <p><strong>Has Paid Flag:</strong> {hasPaid ? 'true' : 'false'}</p>
          <p><strong>Payment Threshold:</strong> R200.00</p>
          <p><strong>Page Exempt From Payment:</strong> {isExemptPage() ? 'Yes' : 'No'}</p>
          <p><strong>Payment Status:</strong> {creditBalance >= 200 || hasPaid ? 'Sufficient' : 'Insufficient'}</p>
        </div>
      )}
    </div>
  );
};

export function Payment({ onClose, onSuccess }: PaymentProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { creditBalance, refreshPaymentStatus, hasPaid, closePaymentModal } = usePayment();
  const [amount, setAmount] = useState(200);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRef, setCurrentRef] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { darkMode } = useTheme();
  const isMounted = useRef(true);
  const pendingOperationsRef = useRef<AbortController[]>([]);
  const completingPaymentRef = useRef(false);

  // Default onClose handler to redirect back to main app
  const handleOnClose = useCallback(async () => {
    if (onClose) {
      onClose();
    } else {
      try {
        // Force refresh payment status before checking credit balance
        await refreshPaymentStatus();
        console.log('Payment status after refresh:', { creditBalance, hasPaid });
        
        // Check if we have enough credit to skip the payment flow
        if (creditBalance >= 200 || hasPaid) {
          console.log('Navigation criteria met, redirecting to home');
          // Navigate to main app with delay to allow state updates
          setTimeout(() => {
            if (isMounted.current) {
              console.log('Executing navigation to root');
              // By navigating to the root, the protected route will redirect to the proper page
              navigate('/', { replace: true });
            }
          }, 500); // Increased timeout to 500ms
        } else {
          console.log('Not enough credit for navigation', { creditBalance, hasPaid });
        }
      } catch (err) {
        console.error('Error in handleOnClose:', err);
      }
    }
  }, [onClose, navigate, creditBalance, hasPaid, refreshPaymentStatus]);

  // Helper for tracking operations
  const registerOperation = () => {
    const controller = new AbortController();
    pendingOperationsRef.current.push(controller);
    return {
      signal: controller.signal,
      complete: () => {
        pendingOperationsRef.current = pendingOperationsRef.current.filter(c => c !== controller);
      }
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Abort any pending operations
      pendingOperationsRef.current.forEach(controller => {
        try {
          controller.abort();
        } catch (err) {
          console.error('Error aborting payment operation:', err);
        }
      });
    };
  }, []);

  // Get Paystack config at runtime instead of build time
  const getPaystackConfig = () => {
    const config = getEnvConfig();
    return {
      reference: currentRef || `ref_${Date.now()}`,
      email: user?.email || '',
      amount: amount * 100, // Convert to kobo
      publicKey: config.PAYSTACK_PUBLIC_KEY,
      // Cast currency to any to bypass type checking
      currency: 'ZAR' 
    };
  };

  // Initialize Paystack hook with dynamic config - cast config to any to bypass type checking
  const initializePaystack = usePaystackPayment(getPaystackConfig() as any);

  // Update handleSuccess to use the handleOnClose function
  const handleSuccess = useCallback(async (reference: string) => {
    // Prevent multiple completions
    if (completingPaymentRef.current) {
      return;
    }
    completingPaymentRef.current = true;

    const toastId = toast.loading('Processing payment...');
    const operation = registerOperation();
    
    try {
      console.log('Processing payment completion with reference:', reference);
      await completePaymentTransaction(currentRef, reference);
      
      // Only continue if component is still mounted
      if (isMounted.current) {
        console.log('Payment completed, refreshing payment status');
        await refreshPaymentStatus();
        
        if (isMounted.current) {
          setShowModal(false);
          toast.success('Payment successful! Your account has been credited.', { 
            id: toastId,
            duration: 3000
          });
          
          // Explicitly close the payment modal
          closePaymentModal();
          
          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess();
          }
          
          // Add a more significant delay before navigation to ensure state updates are complete
          console.log('Payment success, preparing for navigation');
          setTimeout(async () => {
            if (isMounted.current) {
              // Refresh payment status one more time before navigation
              console.log('Final refresh before navigation');
              await refreshPaymentStatus();
              
              // Call the handleOnClose function to redirect
              if (isMounted.current) {
                handleOnClose();
              }
            }
          }, 800);
        }
      }
    } catch (err) {
      console.error('Error completing payment:', err);
      if (isMounted.current) {
        toast.error('Payment failed. Please try again.', { 
          id: toastId,
          duration: 3000
        });
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      completingPaymentRef.current = false;
      operation.complete();
    }
  }, [currentRef, refreshPaymentStatus, handleOnClose, closePaymentModal, onSuccess]);

  // Handle payment button click - now opens the modal
  const handlePayment = async () => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    const operation = registerOperation();
    
    try {
      // Create transaction record in your backend
      const data = await createPaymentTransaction(amount, 'paystack');
      
      if (isMounted.current) {
        setCurrentRef(data.reference);
        setShowModal(true);
      }
    } catch (err) {
      console.error('Payment error:', err);
      if (isMounted.current) {
        toast.error('Failed to initialize payment', {
          duration: 3000 // 3 seconds
        });
        setIsLoading(false);
      }
    } finally {
      operation.complete();
    }
  };

  // Update handleCloseModal to use the handleOnClose function
  const handleCloseModal = useCallback(() => {
    // Prevent closing during active operations
    if (completingPaymentRef.current) {
      return;
    }
    
    if (isMounted.current) {
      setShowModal(false);
      setIsLoading(false);
      
      toast('Payment cancelled', {
        icon: 'ℹ️',
        duration: 2000,
        style: {
          background: darkMode ? '#1f2937' : '#f3f4f6',
          color: darkMode ? '#e5e7eb' : '#374151',
        }
      });
      
      // Use the handleOnClose function
      setTimeout(() => {
        if (isMounted.current) {
          handleOnClose();
        }
      }, 300);
    }
  }, [darkMode, handleOnClose]);

  // Update the useEffect that initializes payment
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (currentRef && isLoading && showModal && !completingPaymentRef.current) {
      // Small delay to ensure state is updated
      timer = setTimeout(() => {
        if (isMounted.current) {
          try {
            // Create a safe wrapper around the payment initialization
            const safeInitializePayment = () => {
              try {
                // Use the function according to the library's API
                // Cast callbacks to any to bypass type checking
                const onSuccess = (response: any) => {
                  try {
                    // Ensure we safely handle the response
                    if (response && response.reference) {
                      handleSuccess(response.reference);
                    } else {
                      // Handle missing reference
                      console.error('Payment response missing reference', response);
                      if (isMounted.current) {
                        toast.error('Payment validation failed. Please try again.');
                        setIsLoading(false);
                      }
                    }
                  } catch (err) {
                    console.error('Error in payment success handler:', err);
                    if (isMounted.current) {
                      toast.error('Error processing payment. Please try again.');
                      setIsLoading(false);
                    }
                  }
                };

                const onClose = () => {
                  try {
                    handleCloseModal();
                  } catch (err) {
                    console.error('Error in payment close handler:', err);
                    if (isMounted.current) {
                      setShowModal(false);
                      setIsLoading(false);
                    }
                  }
                };

                // Call the function directly with the correct parameters
                // Cast it as any to bypass type checking
                (initializePaystack as any)(onSuccess, onClose);
              } catch (err) {
                console.error('Error initializing payment:', err);
                if (isMounted.current) {
                  toast.error('Unable to initialize payment. Please try again.');
                  setIsLoading(false);
                  setShowModal(false);
                }
              }
            };
            
            // Execute the payment initialization
            safeInitializePayment();
          } catch (err) {
            console.error('Critical error in payment initialization:', err);
            if (isMounted.current) {
              toast.error('Payment service unavailable. Please try again later.');
              setIsLoading(false);
              setShowModal(false);
            }
          }
        }
      }, 300);
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [currentRef, isLoading, showModal, handleSuccess, handleCloseModal, initializePaystack]);

  return (
    <div className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all duration-300 ease-in-out animate-fadeIn`}>
      {/* Close button */}
      <button
        onClick={handleCloseModal}
        className={`absolute top-4 right-4 p-2 rounded-full hover:bg-opacity-20 transition-colors ${
          darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
        aria-label="Close payment modal"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mb-6">
        <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          Add Credit to Your Account
        </h2>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
          You need at least R200 credit to access the Dashboard and Customers page.
          Add credit to unlock all features.
        </p>
        
        {creditBalance > 0 && (
          <div className={`${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50'} p-4 rounded-lg mb-4 transition-colors duration-200`}>
            <p className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              Current balance: R{creditBalance.toFixed(2)}
            </p>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <label className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`} htmlFor="amount">
          Amount (ZAR)
        </label>
        <div className="flex items-center">
          <span className={`${darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-500 border-gray-300'} px-3 py-3 rounded-l-md border border-r-0 transition-colors duration-200`}>
            R
          </span>
          <input
            id="amount"
            type="number"
            min="200"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className={`flex-grow border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-300 text-gray-900'} px-3 py-3 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
          />
        </div>
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
          Minimum amount: R200
        </p>
      </div>
      
      <button
        onClick={handlePayment}
        disabled={isLoading || amount < 200 || !user}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? 'Processing...' : 'Pay with Paystack'}
      </button>
      
      <div className="mt-4 text-center text-sm text-gray-400">
        <p>Secure payment powered by Paystack</p>
      </div>

      {/* Add debug info component */}
      <DebugInfo creditBalance={creditBalance} hasPaid={hasPaid} />
    </div>
  );
}

export default Payment; 