import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Factor } from '@supabase/supabase-js';

interface MFAVerifyProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAVerify({ onSuccess, onCancel }: MFAVerifyProps) {
  const { listMFAFactors, challengeMFA, verifyMFA } = useAuth();
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingPhase, setProcessingPhase] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [codeExpiringSoon, setCodeExpiringSoon] = useState(false);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [factors, setFactors] = useState<{totp: Factor[]} | null>(null);
  
  // Use refs for the input element
  const inputRef = useRef<HTMLInputElement>(null);
  // Add debounce timer to prevent multiple rapid verify attempts
  const verifyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch factors only once when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const fetchFactors = async () => {
      try {
        setProcessingPhase('Getting factors...');
        const { data: factorsData, error: factorsError } = await listMFAFactors();
        
        if (factorsError) {
          console.error('Error fetching MFA factors:', factorsError);
          if (isMounted) {
            setError('Failed to get authentication factors. Please try again.');
            setProcessingPhase(null);
          }
          return;
        }
        
        if (isMounted) {
          setFactors(factorsData);
          setProcessingPhase(null);
        }
      } catch (err) {
        console.error('Unexpected error fetching factors:', err);
        if (isMounted) {
          setError('An unexpected error occurred. Please try again.');
          setProcessingPhase(null);
        }
      }
    };
    
    fetchFactors();
    
    return () => {
      isMounted = false;
    };
  }, [listMFAFactors]);

  // Client-side time validation - show warning when TOTP code is about to expire
  useEffect(() => {
    if (!verifyCode || loading) return;

    const checkCodeExpiration = () => {
      // TOTP codes rotate every 30 seconds, warn when < 5 seconds left
      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = 30 - (now % 30);
      setCodeExpiringSoon(secondsLeft <= 5);
    };

    // Check immediately and every second
    checkCodeExpiration();
    const timer = setInterval(checkCodeExpiration, 1000);
    
    return () => clearInterval(timer);
  }, [verifyCode, loading]);

  // Focus the input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleVerify = useCallback(async () => {
    // Clear any existing debounce timer
    if (verifyDebounce.current) {
      clearTimeout(verifyDebounce.current);
    }
    
    // Add debounce to prevent multiple rapid verifications
    verifyDebounce.current = setTimeout(async () => {
      if (!verifyCode.trim() || verifyCode.length !== 6) {
        setError('Please enter a valid 6-digit verification code');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Set up a timeout to handle stalled requests
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Verification timed out. Please try again.'));
          }, 10000); // 10 second timeout
        });
        
        // If we don't have factors yet, we need to wait
        if (!factors) {
          setProcessingPhase('Getting factors...');
          try {
            // Use Promise.race to handle potential timeout
            const factorsResult = await Promise.race([
              listMFAFactors(),
              timeoutPromise
            ]) as { data: {totp: Factor[]} | null, error: Error | null };
            
            if (factorsResult.error) {
              throw factorsResult.error;
            }
            
            setFactors(factorsResult.data);
          } catch (err) {
            if (err instanceof Error && err.message.includes('timed out')) {
              throw err;
            }
            throw new Error('Failed to get authentication factors. Please try again.');
          }
        }

        // Get the first TOTP factor
        const totpFactor = factors?.totp[0];
        if (!totpFactor) {
          throw new Error('No TOTP factors found');
        }

        // Create a challenge
        setProcessingPhase('Creating challenge...');
        
        // Monitor network latency for challenge creation
        const challengeStart = performance.now();
        
        // Use Promise.race for the challenge creation as well
        const challengeResult = await Promise.race([
          challengeMFA(totpFactor.id),
          timeoutPromise
        ]) as { data: { id: string } | null, error: Error | null };
        
        const challengeTime = performance.now() - challengeStart;
        setNetworkLatency(Math.round(challengeTime));
        
        if (challengeResult.error) {
          throw challengeResult.error;
        }

        if (!challengeResult.data) {
          throw new Error('No challenge returned from server');
        }

        // Verify the challenge with the user-provided code
        setProcessingPhase('Verifying code...');
        
        // Use Promise.race for verification
        const verifyResult = await Promise.race([
          verifyMFA(
            totpFactor.id,
            challengeResult.data.id,
            verifyCode
          ),
          timeoutPromise
        ]) as { error: Error | null, data: unknown | null };

        if (verifyResult.error) {
          // Increment attempt counter
          setAttemptCount(prev => prev + 1);
          throw verifyResult.error;
        }
        
        setProcessingPhase('Completing verification...');

        // Add a small delay to prevent immediate navigation which may cause throttling
        setTimeout(() => {
          setProcessingPhase(null);
          onSuccess();
        }, 300);
      } catch (err) {
        console.error('MFA verification error:', err);
        // Enhanced error messages based on different scenarios
        if (err instanceof Error) {
          if (err.message.includes('timed out')) {
            setError('Verification request timed out. Please check your connection and try again.');
          } else if (err.message.includes('Invalid TOTP code')) {
            if (attemptCount >= 2) {
              setError('Invalid code. Please ensure your device time is correct and try a fresh code from your authenticator app.');
            } else {
              setError('Invalid verification code. Please try again with a new code from your authenticator app.');
            }
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to verify MFA code');
        }
        setProcessingPhase(null);
        
        // Clear the input field for a fresh attempt
        setVerifyCode('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } finally {
        setLoading(false);
        verifyDebounce.current = null;
      }
    }, 300); // 300ms debounce to prevent rapid verification attempts
  }, [verifyCode, factors, listMFAFactors, challengeMFA, verifyMFA, onSuccess, attemptCount]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Filter to only allow digits and max 6 characters
    const filteredValue = value.replace(/\D/g, '').substring(0, 6);
    setVerifyCode(filteredValue);
  };

  // When the verify button is clicked
  const handleVerifyClick = () => {
    if (loading) return;
    
    // Reset expiration warning when manually verifying
    setCodeExpiringSoon(false);
    handleVerify();
  };
  
  // Handle cancel with debounce to prevent multiple rapid navigation events
  const handleCancelWithDebounce = () => {
    if (loading) return;
    
    // Add debounce to prevent multiple rapid cancellations
    if (verifyDebounce.current) {
      clearTimeout(verifyDebounce.current);
    }
    
    verifyDebounce.current = setTimeout(() => {
      onCancel();
      verifyDebounce.current = null;
    }, 300);
  };

  return (
    <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-md">
      <div>
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Two-Factor Authentication
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the verification code from your authenticator app
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {processingPhase && (
        <div className="bg-blue-50 border border-blue-300 text-blue-700 px-4 py-3 rounded flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {processingPhase}
        </div>
      )}

      <div className="mt-6">
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium mb-2 text-blue-700">
            Instructions:
          </h3>
          <ol className="text-sm list-decimal list-inside text-gray-700 space-y-2">
            <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
            <li>Enter the 6-digit code shown in your app</li>
            <li>The code refreshes every 30 seconds, so make sure to use the current one</li>
          </ol>
        </div>

        <label htmlFor="verify-code" className="sr-only">
          Verification Code
        </label>
        <input
          id="verify-code"
          name="verify-code"
          type="text"
          required
          className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="Enter 6-digit code"
          value={verifyCode}
          onChange={handleInputChange}
          maxLength={6}
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          ref={inputRef}
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            TOTP codes expire after 30 seconds. Make sure your device time is accurate.
          </p>
          {networkLatency && (
            <span className="text-xs text-gray-500">
              Network: {networkLatency}ms
            </span>
          )}
        </div>
        
        {codeExpiringSoon && (
          <div className="mt-2 text-xs text-amber-600 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Code is about to expire - consider waiting for a new code before verifying
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={handleCancelWithDebounce}
          className="group relative w-1/3 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="button"
          id="verify-button"
          onClick={handleVerifyClick}
          disabled={loading || verifyCode.length !== 6}
          className="group relative w-2/3 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>
      </div>
    </div>
  );
}