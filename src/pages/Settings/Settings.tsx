import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getSettings, updateSettings } from '../../lib/api';
import { usePayment } from '../../hooks/usePayment';
import { useAuth } from '../../hooks/useAuth';
import type { Settings } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { Payment } from '../Payment';
import { supabase } from '../../lib/supabase';
import { MFASetup } from '../../components/MFASetup';
import { Factor } from '@supabase/supabase-js';

export function Settings() {
  console.log('Settings component mounted');
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const { refreshPaymentStatus, isLoadingPayment, showPaymentModal: contextShowPaymentModal, closePaymentModal, openPaymentModal } = usePayment();
  const { listMFAFactors, unenrollMFA, challengeMFA, verifyMFA } = useAuth();
  const [redemptionThreshold, setRedemptionThreshold] = useState(10);
  const [totalCoffees, setTotalCoffees] = useState(0);
  const [lastResetDate, setLastResetDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showMFASetupModal, setShowMFASetupModal] = useState(false);
  const [showDisableMFAModal, setShowDisableMFAModal] = useState(false);
  const [disableTOTPCode, setDisableTOTPCode] = useState('');
  const [verifyingTOTP, setVerifyingTOTP] = useState(false);
  const [totpError, setTOTPError] = useState<string | null>(null);
  const [mfaFactors, setMfaFactors] = useState<Factor[]>([]);
  const [loadingMFA, setLoadingMFA] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Combined loading state for any loading condition
  const isLoading = loading || saving || isLoadingPayment || passwordSaving || loadingMFA;

  // Load MFA factors
  const loadMFAFactors = useCallback(async () => {
    try {
      setLoadingMFA(true);
      const { data, error } = await listMFAFactors();
      
      if (error) {
        console.error('Error loading MFA factors:', error);
        return;
      }
      
      if (data?.totp) {
        setMfaFactors(data.totp);
      }
    } catch (err) {
      console.error('Error loading MFA factors:', err);
    } finally {
      setLoadingMFA(false);
    }
  }, [listMFAFactors]);

  // Handle MFA setup
  const handleMFAEnrolled = useCallback(() => {
    setShowMFASetupModal(false);
    loadMFAFactors();
    setSuccessMessage('Two-factor authentication has been enabled successfully');
  }, [loadMFAFactors]);

  // Handle MFA disable - Update to show verification modal instead of immediately disabling
  const handleDisableMFA = useCallback(() => {
    if (!mfaFactors.length) return;
    setShowDisableMFAModal(true);
  }, [mfaFactors]);

  // New function to actually disable MFA after verification
  const handleVerifyAndDisableMFA = useCallback(async () => {
    if (!mfaFactors.length || !disableTOTPCode.trim()) {
      setTOTPError('Please enter your verification code');
      return;
    }

    try {
      setVerifyingTOTP(true);
      setTOTPError(null);
      
      const factorId = mfaFactors[0].id;
      
      // First verify the TOTP code
      const { data: challenge, error: challengeError } = await challengeMFA(factorId);
      if (challengeError) {
        throw challengeError;
      }
      
      // Verify the challenge with the user-provided code
      const { error: verifyError } = await verifyMFA(
        factorId,
        challenge!.id,
        disableTOTPCode
      );
      
      if (verifyError) {
        throw verifyError;
      }
      
      // Now that TOTP is verified, disable MFA
      const { error } = await unenrollMFA(factorId);
      
      if (error) {
        throw error;
      }
      
      // Reload factors
      await loadMFAFactors();
      setShowDisableMFAModal(false);
      setDisableTOTPCode('');
      setSuccessMessage('Two-factor authentication has been disabled successfully');
    } catch (err) {
      setTOTPError(err instanceof Error ? err.message : 'Failed to verify code or disable two-factor authentication');
    } finally {
      setVerifyingTOTP(false);
    }
  }, [mfaFactors, disableTOTPCode, challengeMFA, verifyMFA, unenrollMFA, loadMFAFactors]);

  // Memoize the load function to ensure it doesn't change on renders
  const loadSettingsData = useCallback(async () => {
    if (saving) return; // Don't load while saving
    
    try {
      setLoading(true);
      setError(null);
      
      // Use a simple approach - no Promise.race to avoid complications
      const settingsData = await getSettings();
      
      // Update settings state all at once
      setRedemptionThreshold(settingsData.redemption_threshold);
      setTotalCoffees(settingsData.total_coffees_purchased || 0);
      
      // Direct assignment without verbose logging
      if (settingsData.credit_balance !== undefined && settingsData.credit_balance !== null) {
        setCreditBalance(settingsData.credit_balance);
      }
      setIsPaid(!!settingsData.has_paid);
      
      if (settingsData.last_reset_date) {
        setLastResetDate(new Date(settingsData.last_reset_date));
      } else {
        // If no reset date, use the first day of current month
        const now = new Date();
        setLastResetDate(new Date(now.getFullYear(), now.getMonth(), 1));
      }
    } catch (err) {
      console.error('Error loading settings data:', err);
      setError('Failed to load settings data. Please refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  }, [saving]);

  // Initial load of settings
  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData, refreshCount]);
  
  // Load MFA factors on component mount
  useEffect(() => {
    loadMFAFactors();
  }, [loadMFAFactors]);
  
  // Completely separate effect for payment status
  // Only run once when the component mounts, not on every settings load
  useEffect(() => {
    // Only refresh payment status once when component mounts
    const updatePaymentStatus = async () => {
      try {
        await refreshPaymentStatus();
      } catch (err) {
        console.error('Error refreshing payment status:', err);
      }
    };
    
    updatePaymentStatus();
    // No dependencies to prevent cycles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync with PaymentContext modal state
  useEffect(() => {
    // If modal is closed in context but open in local state, close it in local state
    if (!contextShowPaymentModal && showPaymentModal) {
      setShowPaymentModal(false);
    }
  }, [contextShowPaymentModal, showPaymentModal]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (redemptionThreshold < 1) {
      setError('Redemption threshold must be at least 1');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      await updateSettings({ redemption_threshold: redemptionThreshold });
      
      // Only show success message if we're done loading
      // Will be displayed once isLoading becomes false
      setSuccessMessage('Settings saved successfully');
      
      // Increment refresh count to trigger a reload
      setRefreshCount(prev => prev + 1);
      
      // Refresh payment status separately
      await refreshPaymentStatus().catch(err => {
        console.error('Error refreshing payment status:', err);
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Calculate next reset date (1st of next month)
  const getNextResetDate = useCallback(() => {
    if (!lastResetDate) return 'at the beginning of next month';
    
    const nextMonth = new Date(lastResetDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1); // First day of next month
    
    return nextMonth.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [lastResetDate]);

  // Get formatted reset date
  const getFormattedResetDate = useCallback(() => {
    if (!lastResetDate) return 'Not available';
    
    return lastResetDate.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [lastResetDate]);

  // Memoize the payment modal close handler
  const handlePaymentClose = useCallback(async () => {
    setShowPaymentModal(false);
    closePaymentModal(); // Also close in context
    // Make sure we're in loading state while refreshing payment
    setSaving(true);
    
    try {
      const oldBalance = creditBalance;
      await refreshPaymentStatus();
      
      // Create a timeout to allow state to update, then check if balance increased
      setTimeout(() => {
        if (creditBalance > oldBalance) {
          setSuccessMessage('Payment successful! Your account has been credited.');
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error refreshing payment status:', err);
    } finally {
      setSaving(false);
    }
  }, [refreshPaymentStatus, closePaymentModal, creditBalance]);

  // Memoize the error toast
  const errorToast = useMemo(() => {
    if (!error) return null;
    
    return (
      <div className={`${darkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 p-4 rounded-lg shadow-md mb-6 relative`}>
        <p className="font-medium">{error}</p>
        <button 
          className="absolute top-0 right-0 px-4 py-3" 
          onClick={() => setError(null)}
        >
          <span className="sr-only">Close</span>
          <span className="text-red-700">&times;</span>
        </button>
      </div>
    );
  }, [error, darkMode]);

  // Memoize the success toast
  const successToast = useMemo(() => {
    if (!successMessage) return null;
    
    return (
      <div className={`${darkMode ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-50 border-green-500 text-green-700'} border-l-4 p-4 rounded-lg shadow-md mb-6 relative`}>
        <p className="font-medium">{successMessage}</p>
        <button 
          className="absolute top-0 right-0 px-4 py-3" 
          onClick={() => setSuccessMessage(null)}
        >
          <span className="sr-only">Close</span>
          <span className="text-green-700">&times;</span>
        </button>
      </div>
    );
  }, [successMessage, darkMode]);
  
  // Memoize the payment form
  const paymentForm = useMemo(() => {
    if (!showPaymentModal || isLoading) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <Payment 
          onClose={handlePaymentClose} 
          onSuccess={() => {
            // Set success message directly when Payment signals success
            setSuccessMessage('Payment successful! Your account has been credited.');
          }}
        />
      </div>
    );
  }, [showPaymentModal, isLoading, handlePaymentClose]);

  // Password change handler
  const handlePasswordChange = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setPasswordError(null);
    setPasswordSuccess(null);
    
    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setPasswordSaving(true);
      
      // Use user's email from the Auth context if available
      let userEmail = user?.email;
      
      // If no email from Auth context, try getting it from the session
      if (!userEmail) {
        const { data: sessionData } = await supabase.auth.getSession();
        userEmail = sessionData.session?.user.email;
        
        if (!userEmail) {
          setPasswordError('User session not found. Please log in again.');
          return;
        }
      }
      
      // Verify the current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      });
      
      if (signInError) {
        setPasswordError('Current password is incorrect');
        return;
      }
      
      // If current password is verified, update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        setPasswordError(error.message);
        return;
      }
      
      // Clear form and show success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password updated successfully');
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(null);
      }, 2000);
      
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError('Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword, user]);
  
  const handlePasswordModalClose = useCallback(() => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
  }, []);

  // Memoize the password modal
  const passwordModal = useMemo(() => {
    if (!showPasswordModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-md w-full p-6 relative`}>
          <button 
            className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={handlePasswordModalClose}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span className="sr-only">Close</span>
          </button>
          
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center`}>
            <svg className={`h-7 w-7 mr-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
            Change Password
          </h2>
          
          {passwordError && (
            <div className={`${darkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 p-4 rounded-lg shadow-md mb-4 relative`}>
              <p className="font-medium">{passwordError}</p>
              <button 
                className="absolute top-0 right-0 px-4 py-3" 
                onClick={() => setPasswordError(null)}
              >
                <span className="sr-only">Close</span>
                <span className="text-red-700">&times;</span>
              </button>
            </div>
          )}
          
          {passwordSuccess && (
            <div className={`${darkMode ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-50 border-green-500 text-green-700'} border-l-4 p-4 rounded-lg shadow-md mb-4 relative`}>
              <p className="font-medium">{passwordSuccess}</p>
              <button 
                className="absolute top-0 right-0 px-4 py-3" 
                onClick={() => setPasswordSuccess(null)}
              >
                <span className="sr-only">Close</span>
                <span className="text-green-700">&times;</span>
              </button>
            </div>
          )}
          
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            <p className="mb-2">You'll need to enter your current password for security verification.</p>
            {user?.email && (
              <p className="font-medium mb-3">
                Email: <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>{user.email}</span>
              </p>
            )}
          </div>
          
          <form onSubmit={handlePasswordChange}>
            <div className="mb-4">
              <label htmlFor="currentPassword" className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2`}>
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full p-3 border rounded-lg shadow-sm ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500 focus:border-blue-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2`}>
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full p-3 border rounded-lg shadow-sm ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500 focus:border-blue-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                required
                minLength={6}
              />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 ml-1`}>
                Must be at least 6 characters long
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirmPassword" className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2`}>
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full p-3 border rounded-lg shadow-sm ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500 focus:border-blue-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handlePasswordModalClose}
                className={`px-4 py-2 rounded-lg font-medium ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }, [showPasswordModal, darkMode, passwordError, passwordSuccess, currentPassword, newPassword, confirmPassword, passwordSaving, user, handlePasswordChange, handlePasswordModalClose]);

  // Add this to your component, right after the passwordModal constant
  const mfaSetupModal = useMemo(() => {
    if (!showMFASetupModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <MFASetup 
          onEnrolled={handleMFAEnrolled} 
          onCancel={() => setShowMFASetupModal(false)} 
        />
      </div>
    );
  }, [showMFASetupModal, handleMFAEnrolled]);

  // Add this to the memoized modals section - after mfaSetupModal
  const disableMFAModal = useMemo(() => {
    if (!showDisableMFAModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl max-w-md w-full p-6 relative`}>
          <button 
            className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => {
              setShowDisableMFAModal(false);
              setDisableTOTPCode('');
              setTOTPError(null);
            }}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span className="sr-only">Close</span>
          </button>
          
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-gray-200' : 'text-gray-900'} flex items-center`}>
            <svg className={`h-7 w-7 mr-3 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            Disable Two-Factor Auth
          </h2>
          
          {totpError && (
            <div className={`${darkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 p-4 rounded-lg shadow-md mb-4 relative`}>
              <p className="font-medium">{totpError}</p>
            </div>
          )}
          
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            <p className="mb-2">Please enter your authenticator code to confirm disabling two-factor authentication.</p>
            <p className="mb-3 font-medium">This step is required for security purposes.</p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="disableTOTPCode" className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2`}>
              Verification Code
            </label>
            <input
              type="text"
              id="disableTOTPCode"
              value={disableTOTPCode}
              onChange={(e) => setDisableTOTPCode(e.target.value.trim())}
              className={`w-full p-3 border rounded-lg shadow-sm ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500 focus:border-blue-500' 
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              maxLength={6}
              placeholder="Enter 6-digit code"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowDisableMFAModal(false);
                setDisableTOTPCode('');
                setTOTPError(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium ${
                darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleVerifyAndDisableMFA}
              disabled={verifyingTOTP || !disableTOTPCode.trim()}
              className={`inline-flex items-center px-4 py-2 ${
                darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'
              } text-white rounded-lg font-medium shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50`}
            >
              {verifyingTOTP ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify and Disable'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }, [showDisableMFAModal, darkMode, disableTOTPCode, totpError, verifyingTOTP, handleVerifyAndDisableMFA]);

  // If any loading state is active, show the single spinner
  if (isLoading) {
    return (
      <div className={`container mx-auto px-4 py-6 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-6 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="mb-6">
        <Link to="/" className={`inline-flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-800'} transition-colors mb-3`}>
          <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to dashboard
        </Link>
        <h1 className={`text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700 ${darkMode ? 'dark:text-gray-100' : ''}`}>Settings</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2 transition-colors duration-200`}>Configure your loyalty program settings</p>
      </div>

      {errorToast}
      {successToast}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center mb-5">
            <svg className={`h-8 w-8 mr-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Loyalty Program Settings</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-md">
            <div className="mb-4">
              <label htmlFor="redemptionThreshold" className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2`}>
                Units required for redemption
              </label>
              <input
                type="number"
                id="redemptionThreshold"
                min="1"
                value={redemptionThreshold}
                onChange={(e) => setRedemptionThreshold(parseInt(e.target.value))}
                className={`w-full p-3 border rounded-lg shadow-sm ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-200 focus:ring-blue-500 focus:border-blue-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 ml-1`}>
                Number of units a customer needs to purchase before earning a free unit.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Save Settings
            </button>
          </form>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center mb-5">
            <svg className={`h-8 w-8 mr-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
            </svg>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Unit Statistics</h2>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Monthly Units Sold:</span>
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-700`}>{totalCoffees}</span>
            </div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mb-3`}>
              Number of units sold in the current month.
            </p>
            
            <div className={`${darkMode ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-100'} p-4 rounded-lg border shadow-sm`}>
              <div className="flex items-center mb-2">
                <svg className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className={`${darkMode ? 'font-medium' : ''}`}>Last Reset:</span> {getFormattedResetDate()}
                </p>
              </div>
              <div className="flex items-center mb-2">
                <svg className={`h-5 w-5 mr-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className={`${darkMode ? 'font-medium' : ''}`}>Next Reset:</span> {getNextResetDate()}
                </p>
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs mt-2 ml-7`}>Counter automatically resets at the beginning of each month.</p>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center mb-5">
            <svg className={`h-8 w-8 mr-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
            </svg>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Account Credit</h2>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Current Balance:</span>
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700`}>
                R{typeof creditBalance === 'number' ? creditBalance.toFixed(2) : 'Loading...'}
              </span>
            </div>
            
            <div className={`${darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-100'} p-4 rounded-lg border shadow-sm mb-4`}>
              <div className="flex items-start">
                <svg className={`h-5 w-5 mr-2 mt-0.5 ${darkMode ? 'text-green-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  {isPaid ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  )}
                </svg>
                <div>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-1`}>
                    {isPaid 
                      ? 'Your account has full access' 
                      : 'Some features require credit'}
                  </p>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>
                    {isPaid 
                      ? 'You have full access to the Dashboard and Customers page.' 
                      : 'You need at least R200 credit to access the Dashboard and Customers page.'}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowPaymentModal(true);
                openPaymentModal(); // Also open in context
              }}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add Credit
            </button>
          </div>
        </div>

        {/* Security Settings Card - updated with MFA */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center mb-5">
            <svg className={`h-8 w-8 mr-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Security Settings</h2>
          </div>
          
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            <p className="mb-2">Manage your account security settings.</p>
            {user?.email && (
              <p className="font-medium mb-3">
                Email: <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>{user.email}</span>
              </p>
            )}
          </div>

          {/* Two-Factor Authentication Status */}
          <div className={`${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'} p-4 rounded-lg border shadow-sm mb-4`}>
            <div className="flex items-start">
              <svg className={`h-5 w-5 mr-2 mt-0.5 ${darkMode ? mfaFactors.length ? 'text-green-600' : 'text-amber-600' : mfaFactors.length ? 'text-green-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {mfaFactors.length ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                )}
              </svg>
              <div>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-1`}>
                  {mfaFactors.length 
                    ? 'Two-factor authentication is enabled' 
                    : 'Two-factor authentication is disabled'}
                </p>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>
                  {mfaFactors.length 
                    ? 'Your account is secured with two-factor authentication.' 
                    : 'We recommend enabling two-factor authentication for added security.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* MFA Controls */}
          {mfaFactors.length > 0 ? (
            <button
              onClick={handleDisableMFA}
              disabled={loadingMFA}
              className={`w-full mb-3 inline-flex items-center justify-center px-4 py-2.5 ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-lg font-medium shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50`}
            >
              {loadingMFA ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Disabling...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                  </svg>
                  Disable Two-Factor Auth
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowMFASetupModal(true)}
              disabled={loadingMFA}
              className="w-full mb-3 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loadingMFA ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                  Enable Two-Factor Auth
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
            </svg>
            Change Password
          </button>
        </div>
        
        {/* WhatsApp Integration Card */}
        <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
          <div className="flex items-center mb-5">
            <svg className={`h-8 w-8 mr-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <div className="flex items-center">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Link WhatsApp</h2>
              <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded-full ${darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-800'}`}>
                In Development
              </span>
            </div>
          </div>
          
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            <p className="mb-2">Connect your WhatsApp account to send automated messages to customers.</p>
            <p className="mb-3">
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Coming soon:</span> Automated loyalty updates, reminders, and promotions directly through WhatsApp.
            </p>
          </div>
          
          <button
            disabled
            className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg font-medium shadow-md opacity-70 cursor-not-allowed"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            Connect WhatsApp (Coming Soon)
          </button>
        </div>
      </div>

      {/* Use the memoized payment form */}
      {paymentForm}
      
      {/* Password Change Modal */}
      {passwordModal}

      {/* MFA Setup Modal */}
      {mfaSetupModal}
      
      {/* MFA Disable Modal */}
      {disableMFAModal}
    </div>
  );
}

// Add default export for lazy loading support
export default Settings; 