import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Factor } from '@supabase/supabase-js';

interface MFASetupProps {
  onEnrolled: () => void;
  onCancel: () => void;
}

// Define the expected response type from enrollMFA
interface EnrollMFAResponse {
  id: string;
  qr: string;
  totp?: {
    secret: string;
  };
}

export function MFASetup({ onEnrolled, onCancel }: MFASetupProps) {
  const { darkMode } = useTheme();
  const { enrollMFA, challengeMFA, verifyMFA, listMFAFactors, unenrollMFA } = useAuth();
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingFactors, setExistingFactors] = useState<Factor[]>([]);
  const [unenrolling, setUnenrolling] = useState(false);
  const [showExistingFactorMessage, setShowExistingFactorMessage] = useState(false);
  const [verificationStep, setVerificationStep] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [codeExpiringSoon, setCodeExpiringSoon] = useState(false);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);

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

  useEffect(() => {
    const checkExistingFactorsAndEnroll = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First check for existing factors
        console.time('list_factors');
        const { data: factors, error: listError } = await listMFAFactors();
        console.timeEnd('list_factors');
        
        if (listError) {
          throw listError;
        }
        
        // If there are existing TOTP factors with our name
        const existingLoyaltyBeanFactors = factors?.totp?.filter(factor => 
          factor.friendly_name === 'LoyaltyBean' || 
          factor.friendly_name === 'LoyaltyBean-Sheldon'
        ) || [];
        
        setExistingFactors(existingLoyaltyBeanFactors);
        
        if (existingLoyaltyBeanFactors.length > 0) {
          // Show message about existing authenticator
          setShowExistingFactorMessage(true);
          setEnrolling(false);
          return;
        }
        
        // If no existing factors, proceed with enrollment
        console.time('enroll_mfa');
        const { data, error } = await enrollMFA();
        console.timeEnd('enroll_mfa');
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Cast the data to the expected type to safely access properties
          const enrollData = data as EnrollMFAResponse;
          setFactorId(enrollData.id);
          setQrCode(enrollData.qr);
          // Save the secret for manual entry if needed
          setSecret(enrollData.totp?.secret || null);
          setEnrolling(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start MFA enrollment');
      } finally {
        setLoading(false);
      }
    };

    checkExistingFactorsAndEnroll();
  }, [enrollMFA, listMFAFactors]);

  const verifyEnrollment = useCallback(async () => {
    if (!verifyCode.trim() || verifyCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setVerificationStep('Creating challenge...');

      // Monitor network latency for challenge creation
      const challengeStart = performance.now();
      
      // Step 1: Create a challenge
      const { data: challenge, error: challengeError } = await challengeMFA(factorId);
      
      const challengeTime = performance.now() - challengeStart;
      setNetworkLatency(Math.round(challengeTime));
      console.log(`Challenge creation time: ${challengeTime.toFixed(0)}ms`);
      
      if (challengeError) {
        throw challengeError;
      }

      if (!challenge) {
        throw new Error('No challenge returned from server');
      }
      
      setVerificationStep('Verifying code...');

      // Monitor network latency for verification
      const verifyStart = performance.now();
      
      // Step 2: Verify the challenge with the TOTP code
      const { error: verifyError } = await verifyMFA(
        factorId,
        challenge.id,
        verifyCode
      );

      const verifyTime = performance.now() - verifyStart;
      console.log(`Verification time: ${verifyTime.toFixed(0)}ms`);

      if (verifyError) {
        throw verifyError;
      }
      
      setVerificationStep('Completing setup...');
      
      // Reduced artificial delay from 500ms to 100ms
      setTimeout(() => {
        setVerificationStep(null);
        onEnrolled();
      }, 100);
    } catch (err) {
      console.error('MFA verification error:', err);
      if (err instanceof Error && err.message.includes('Invalid TOTP code')) {
        setError('Invalid verification code. Make sure your device time is correct and try again with a fresh code.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to verify MFA code');
      }
      setVerificationStep(null);
      // Clear the code for a fresh attempt
      setVerifyCode('');
    } finally {
      setLoading(false);
    }
  }, [verifyCode, factorId, challengeMFA, verifyMFA, onEnrolled]);
  
  // Handle input changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Filter to only allow digits and max 6 characters
    const filteredValue = value.replace(/\D/g, '').substring(0, 6);
    setVerifyCode(filteredValue);
    
    // Don't auto-verify - only verify when the user clicks the button
  };

  // When the verify button is clicked
  const handleVerifyClick = () => {
    if (loading) return;
    
    // Reset expiration warning when manually verifying
    setCodeExpiringSoon(false);
    verifyEnrollment();
  };

  const handleUnenrollAndSetupNew = async () => {
    if (existingFactors.length === 0) return;
    
    try {
      setUnenrolling(true);
      setError(null);
      
      // Unenroll all existing LoyaltyBean factors
      for (const factor of existingFactors) {
        const { error } = await unenrollMFA(factor.id);
        if (error) {
          throw error;
        }
      }
      
      // Start fresh enrollment
      const { data, error } = await enrollMFA();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Cast the data to the expected type
        const enrollData = data as EnrollMFAResponse;
        setFactorId(enrollData.id);
        setQrCode(enrollData.qr);
        setSecret(enrollData.totp?.secret || null);
        setShowExistingFactorMessage(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unenroll existing factor');
    } finally {
      setUnenrolling(false);
    }
  };

  return (
    <div className={`max-w-md w-full space-y-6 p-8 ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'} rounded-lg shadow-md`}>
      <div>
        <h2 className={`text-center text-2xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          {enrolling ? 'Setting up Two-Factor Authentication...' : showExistingFactorMessage ? 'Authenticator Already Exists' : 'Set Up Two-Factor Authentication'}
        </h2>
        
        {!enrolling && !showExistingFactorMessage && (
          <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Scan the QR code with your authenticator app
          </p>
        )}
      </div>

      {error && (
        <div className={`${darkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded`}>
          {error}
        </div>
      )}

      {verificationStep && (
        <div className={`${darkMode ? 'bg-blue-900/20 border-blue-700 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-700'} border px-4 py-3 rounded flex items-center`}>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {verificationStep}
        </div>
      )}

      {loading && enrolling ? (
        <div className="flex justify-center py-6">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
        </div>
      ) : showExistingFactorMessage ? (
        <>
          <div className={`${darkMode ? 'bg-amber-900/20 border-amber-700 text-amber-400' : 'bg-amber-100 border-amber-400 text-amber-700'} border-l-4 p-4 rounded-lg shadow-md mb-6 relative`}>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
              You already have an authenticator set up with the name "LoyaltyBean". 
              You can continue using your existing authenticator, or remove it and set up a new one.
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Note: Removing your existing authenticator will require you to set up a new one to continue using two-factor authentication.
            </p>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onCancel}
              className={`group relative w-1/3 py-2 px-4 border ${darkMode ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUnenrollAndSetupNew}
              disabled={unenrolling}
              className={`group relative w-2/3 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${darkMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-600 hover:bg-amber-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50`}
            >
              {unenrolling ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Working...
                </>
              ) : (
                'Remove & Set Up New'
              )}
            </button>
          </div>
        </>
      ) : !enrolling && (
        <>
          <div className="flex justify-center">
            {qrCode && (
              <div 
                className={`p-4 ${darkMode ? 'bg-white' : 'bg-gray-100'} rounded-lg`}
                dangerouslySetInnerHTML={{ __html: qrCode }}
              />
            )}
          </div>

          {secret && (
            <div className={`mt-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg text-center`}>
              <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                If you can't scan the QR code, enter this secret manually:
              </p>
              <p className={`font-mono text-sm select-all ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                {secret}
              </p>
            </div>
          )}

          <div className="mt-6">
            <div className={`mb-4 p-3 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-lg`}>
              <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                Instructions:
              </h3>
              <ol className={`text-sm list-decimal list-inside ${darkMode ? 'text-gray-300' : 'text-gray-700'} space-y-2`}>
                <li>Open your authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code or enter the secret key manually</li>
                <li>Enter the 6-digit code shown in your app</li>
              </ol>
            </div>

            <label htmlFor="verify-code" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Verification Code
            </label>
            <input
              id="verify-code"
              name="verify-code"
              type="text"
              required
              className={`appearance-none relative block w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'} rounded-md focus:outline-none focus:z-10 sm:text-sm`}
              placeholder="Enter 6-digit code"
              value={verifyCode}
              onChange={handleCodeChange}
              maxLength={6}
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                TOTP codes expire after 30 seconds. Make sure your device time is accurate.
              </p>
              {networkLatency && (
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Network: {networkLatency}ms
                </span>
              )}
            </div>
            
            {codeExpiringSoon && (
              <div className={`mt-2 text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'} flex items-center`}>
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
              onClick={onCancel}
              className={`group relative w-1/3 py-2 px-4 border ${darkMode ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
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
                'Enable 2FA'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
} 