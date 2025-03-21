import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { getSettings, updateSettings } from '../../lib/api';
import { usePayment } from '../../hooks/usePayment';
import { useAuth } from '../../hooks/useAuth';
import type { Settings } from '../../lib/supabase';
import { useTheme } from '../../hooks/useTheme';
import { Payment } from '../Payment';
import { supabase } from '../../lib/supabase';
import MFASetup from '../../components/MFASetup';
import { Factor } from '@supabase/supabase-js';

export function Settings() {
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
            <PremiumInput
              id="currentPassword"
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            
            <PremiumInput
              id="newPassword"
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              helpText="Must be at least 6 characters long"
            />
            
            <PremiumInput
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <PremiumButton
                variant="secondary"
                onClick={handlePasswordModalClose}
              >
                Cancel
              </PremiumButton>
              
              <PremiumButton
                type="submit"
                disabled={passwordSaving}
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
              </PremiumButton>
            </div>
          </form>
        </div>
      </div>
    );
  }, [showPasswordModal, darkMode, passwordError, passwordSuccess, currentPassword, newPassword, confirmPassword, passwordSaving, user, handlePasswordChange, handlePasswordModalClose]);

  // Add this to your component, right after the passwordModal constant

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
            <PremiumInput
              id="disableTOTPCode"
              label="Verification Code"
              value={disableTOTPCode}
              onChange={(e) => setDisableTOTPCode(e.target.value.trim())}
              maxLength={6}
              placeholder="Enter 6-digit code"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <PremiumButton
              type="button"
              onClick={() => {
                setShowDisableMFAModal(false);
                setDisableTOTPCode('');
                setTOTPError(null);
              }}
            >
              Cancel
            </PremiumButton>
            
            <PremiumButton
              type="button"
              onClick={handleVerifyAndDisableMFA}
              disabled={verifyingTOTP || !disableTOTPCode.trim()}
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
            </PremiumButton>
          </div>
        </div>
      </div>
    );
  }, [showDisableMFAModal, darkMode, disableTOTPCode, totpError, verifyingTOTP, handleVerifyAndDisableMFA]);

  // Enhanced button style - create a reusable button style for primary actions
  const PremiumButton = ({ onClick, children, disabled = false, variant = 'primary', className = '', type = 'button' }: {
    onClick?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    className?: string;
    type?: 'button' | 'submit' | 'reset';
  }) => {
    const { darkMode } = useTheme();
    
    const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 font-medium rounded-lg transition-all duration-200 overflow-hidden shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5";
    
    const variants = {
      primary: `${darkMode 
        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white focus:ring-blue-500' 
        : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white focus:ring-indigo-500'}`,
      secondary: `${darkMode 
        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 focus:ring-gray-500' 
        : 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400'}`,
      danger: `${darkMode 
        ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white focus:ring-red-500' 
        : 'bg-gradient-to-r from-red-600 to-rose-700 text-white focus:ring-red-500'}`,
      outline: `${darkMode 
        ? 'bg-transparent border-2 border-gray-700 text-gray-300 hover:bg-gray-800 focus:ring-gray-600' 
        : 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-400'}`
    };
    
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${className}`}
      >
        <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
        {children}
      </button>
    );
  };

  // After the PremiumButton component, add a PremiumInput component
  const PremiumInput = ({ 
    id, 
    label, 
    value, 
    onChange, 
    type = 'text', 
    placeholder = '', 
    helpText = '',
    min = '',
    max = '',
    required = false,
    maxLength,
    disabled = false
  }: {
    id: string;
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    helpText?: string;
    min?: string | number;
    max?: string | number;
    required?: boolean;
    maxLength?: number;
    disabled?: boolean;
  }) => {
    const { darkMode } = useTheme();
    
    return (
      <div className="mb-5">
        <label 
          htmlFor={id} 
          className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium mb-2`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            min={min}
            max={max}
            maxLength={maxLength}
            disabled={disabled}
            className={`w-full p-3 border rounded-lg shadow-sm ${
              darkMode 
                ? 'bg-gray-800/80 border-gray-700 text-gray-200 focus:ring-blue-500 focus:border-blue-500' 
                : 'bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            } transition-all duration-200 backdrop-blur-sm`}
          />
          {type === 'number' && (
            <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <span className="text-sm">#</span>
            </div>
          )}
          {type === 'password' && (
            <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          )}
        </div>
        {helpText && (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 ml-1`}>
            {helpText}
          </p>
        )}
      </div>
    );
  };

  // Add this after the PremiumInput component
  const PremiumIcon = ({ 
    icon, 
    size = 'md', 
    color = 'primary', 
    className = '' 
  }: {
    icon: 'settings' | 'stats' | 'credit' | 'security' | 'whatsapp' | 'save' | 'add' | 'refresh' | 'lock' | 'check' | 'disable' | 'enable' | 'password' | 'calendar' | 'time' | 'spinner';
    size?: 'sm' | 'md' | 'lg';
    color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
    className?: string;
  }) => {
    const { darkMode } = useTheme();
    
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };
    
    const colorClasses = {
      primary: darkMode ? 'text-blue-400' : 'text-blue-600',
      secondary: darkMode ? 'text-gray-400' : 'text-gray-600',
      success: darkMode ? 'text-green-400' : 'text-green-600',
      danger: darkMode ? 'text-red-400' : 'text-red-600',
      warning: darkMode ? 'text-amber-400' : 'text-amber-600',
      info: darkMode ? 'text-indigo-400' : 'text-indigo-600'
    };
    
    const icons = {
      settings: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      ),
      stats: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      ),
      credit: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
      security: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      ),
      whatsapp: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      ),
      save: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      ),
      add: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
      ),
      refresh: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      ),
      lock: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
      ),
      check: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      ),
      disable: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
        </svg>
      ),
      enable: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
        </svg>
      ),
      password: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
        </svg>
      ),
      calendar: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      ),
      time: (
        <svg className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      ),
      spinner: (
        <svg className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )
    };

    return icons[icon];
  };

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
    <div className={`container mx-auto px-4 py-4 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {errorToast}
      {successToast}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {/* Loyalty Program Settings Card */}
        <div className={`relative overflow-hidden rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} ${loading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '200ms' }}>
          <div className={`absolute top-0 right-0 w-28 h-28 -mt-8 -mr-8 rounded-full ${darkMode ? 'bg-indigo-900/20' : 'bg-indigo-100/50'} blur-2xl`}></div>
          <div className="p-5 relative z-10">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl mr-3 ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                <PremiumIcon icon="settings" size="md" color="primary" />
              </div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loyalty Program Settings</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="max-w-md">
              <PremiumInput
                id="redemptionThreshold"
                label="Units required for redemption"
                type="number"
                value={redemptionThreshold}
                onChange={(e) => setRedemptionThreshold(parseInt(e.target.value))}
                min={1}
                helpText="Number of units a customer needs to purchase before earning a free unit."
              />
              
              <PremiumButton 
                type="submit"
                disabled={isLoading}
                className="group"
              >
                <PremiumIcon icon="save" className="mr-2" />
                Save Settings
              </PremiumButton>
            </form>
          </div>
        </div>

        {/* Unit Statistics Card */}
        <div className={`relative overflow-hidden rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} ${loading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '250ms' }}>
          <div className={`absolute top-0 right-0 w-28 h-28 -mt-8 -mr-8 rounded-full ${darkMode ? 'bg-orange-900/20' : 'bg-orange-100/50'} blur-2xl`}></div>
          <div className="p-5 relative z-10">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl mr-3 ${darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                <PremiumIcon icon="stats" size="md" color="warning" />
              </div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Unit Statistics</h2>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium text-sm`}>Monthly Units Sold:</span>
                <div className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-orange-400 to-amber-400' : 'from-orange-600 to-amber-600'}`}>
                  {totalCoffees}
                </div>
              </div>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs mb-3`}>
                Number of units sold in the current month.
              </p>
              
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100'}`}>
                <div className="flex items-center mb-1.5">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-lg mr-2 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <PremiumIcon icon="calendar" size="sm" />
                  </div>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-xs`}>
                    <span className="font-medium">Last Reset:</span> {getFormattedResetDate()}
                  </p>
                </div>
                <div className="flex items-center mb-1.5">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-lg mr-2 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <PremiumIcon icon="time" size="sm" />
                  </div>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-xs`}>
                    <span className="font-medium">Next Reset:</span> {getNextResetDate()}
                  </p>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-8`}>
                  Counter automatically resets at the beginning of each month.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Credit Card */}
        <div className={`relative overflow-hidden rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} ${loading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`} style={{ transitionDelay: '300ms' }}>
          <div className={`absolute top-0 right-0 w-28 h-28 -mt-8 -mr-8 rounded-full ${darkMode ? 'bg-blue-900/20' : 'bg-blue-100/50'} blur-2xl`}></div>
          <div className="p-5 relative z-10">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl mr-3 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <PremiumIcon icon="credit" size="md" color="info" />
              </div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Account Credit</h2>
            </div>
            
            {/* Credit balance display and account status */}
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
              <p className="mb-2 text-xs">You are charged R2 per transaction. Load credits to continue using the service.</p>
              
              <div className={`flex items-center mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <span className="text-xl font-bold">R{creditBalance.toFixed(2)}</span>
                <span className={`ml-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>current balance</span>
              </div>
              
              <div className={`p-3 rounded-lg mb-3 ${darkMode ? 'bg-blue-900/10 border border-blue-800/20' : 'bg-blue-50 border border-blue-100'}`}>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-4 h-4 mt-0.5 ${darkMode ? 'text-' + (isPaid ? 'green' : 'amber') + '-400' : 'text-' + (isPaid ? 'green' : 'amber') + '-600'}`}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      {isPaid ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      )}
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className={`font-medium text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {isPaid ? 'Your account has full access' : 'Some features require credit'}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isPaid ? 'You have full access to all features.' : 'You need at least R200 credit to access all features.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  R2 per transaction
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  Secure payments
                </span>
              </div>
            </div>
            
            <PremiumButton
              onClick={openPaymentModal}
              className="group text-sm px-4 py-2"
            >
              <PremiumIcon icon="add" className="mr-2" size="sm" />
              Load Credits
            </PremiumButton>
            
            <PremiumButton
              variant="outline"
              onClick={async () => {
                try {
                  await refreshPaymentStatus();
                  await loadSettingsData();
                } catch (err) {
                  console.error('Error refreshing data:', err);
                  setError('Failed to refresh data. Please try again.');
                }
              }}
              className="mt-2 text-xs px-3 py-1.5"
            >
              <PremiumIcon icon="refresh" className="mr-1" size="sm" />
              Refresh Status
            </PremiumButton>
          </div>
        </div>
      </div>

      {/* Security and WhatsApp Integration - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Security Settings Card */}
        <div className={`relative overflow-hidden rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
          <div className={`absolute top-0 right-0 w-28 h-28 -mt-8 -mr-8 rounded-full ${darkMode ? 'bg-purple-900/20' : 'bg-purple-100/50'} blur-2xl`}></div>
          <div className="p-5 relative z-10">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl mr-3 ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                <PremiumIcon icon="security" size="md" color="info" />
              </div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Security Settings</h2>
            </div>
            
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              <p className="mb-1 text-sm">Manage your account security settings.</p>
              {user?.email && (
                <p className="font-medium mb-2 text-sm">
                  Email: <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>{user.email}</span>
                </p>
              )}
            </div>

            {/* Two-Factor Authentication Status */}
            <div className="mb-4">
              <h3 className={`text-base font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Two-Factor Authentication</h3>
              
              {mfaFactors.length > 0 ? (
                <div className="flex items-center mb-3">
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full ${darkMode ? 'bg-green-900/30' : 'bg-green-100'} mr-2`}>
                    <svg className={`h-2.5 w-2.5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>2FA is enabled</span>
                </div>
              ) : (
                <div className="flex items-center mb-3">
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full ${darkMode ? 'bg-red-900/30' : 'bg-red-100'} mr-2`}>
                    <svg className={`h-2.5 w-2.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>2FA is not enabled</span>
                </div>
              )}

              {mfaFactors.length > 0 ? (
                <PremiumButton
                  variant="danger"
                  onClick={handleDisableMFA}
                  className="w-full text-xs px-3 py-1.5"
                >
                  <PremiumIcon icon="disable" className="mr-2" size="sm" color="danger" />
                  Disable 2FA
                </PremiumButton>
              ) : (
                <PremiumButton
                  onClick={() => setShowMFASetupModal(true)}
                  className="w-full text-xs px-3 py-1.5"
                >
                  <PremiumIcon icon="security" className="mr-2" size="sm" />
                  Enable 2FA
                </PremiumButton>
              )}
            </div>

            <PremiumButton
              variant="outline"
              onClick={() => setShowPasswordModal(true)}
              className="w-full text-xs px-3 py-1.5"
            >
              <PremiumIcon icon="password" className="mr-2" size="sm" />
              Change Password
            </PremiumButton>
          </div>
        </div>

        {/* WhatsApp Integration Card */}
        <div className={`relative overflow-hidden rounded-2xl shadow-xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}>
          <div className={`absolute top-0 right-0 w-28 h-28 -mt-8 -mr-8 rounded-full ${darkMode ? 'bg-green-900/20' : 'bg-green-100/50'} blur-2xl`}></div>
          <div className={`absolute bottom-0 left-0 w-28 h-28 -mb-8 -ml-8 rounded-full ${darkMode ? 'bg-emerald-900/20' : 'bg-emerald-100/50'} blur-2xl`}></div>
          <div className="p-5 relative z-10">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl mr-3 ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                <PremiumIcon icon="whatsapp" size="md" color="success" />
              </div>
              <div className="flex items-center">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Link WhatsApp</h2>
                <div className={`ml-2 animate-pulse px-2 py-0.5 rounded-full text-xs font-semibold ${darkMode ? 'bg-amber-900/40 text-amber-400 border border-amber-700/30' : 'bg-amber-100 text-amber-800 border border-amber-200/60'}`}>
                  In Development
                </div>
              </div>
            </div>
            
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              <p className="mb-2 text-sm">Connect your WhatsApp account to send automated messages to customers.</p>
              <p className="mb-2 text-sm">
                <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Coming soon:</span> Automated loyalty updates, reminders, and promotions directly through WhatsApp.
              </p>
            </div>
            
            <button
              disabled
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium shadow-md text-xs opacity-70 ${
                darkMode 
                  ? 'bg-gradient-to-r from-green-800/50 to-emerald-800/50 text-green-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 cursor-not-allowed'
              }`}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              Connect WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modals */}
      {showPaymentModal && (
        <Payment onClose={() => setShowPaymentModal(false)} />
      )}
      
      {contextShowPaymentModal && (
        <Payment onClose={closePaymentModal} />
      )}
      
      {showMFASetupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="max-w-sm w-full transform transition-all">
            <MFASetup onCancel={() => setShowMFASetupModal(false)} onEnrolled={handleMFAEnrolled} />
          </div>
        </div>
      )}
      
      {/* Password Change Modal */}
      {passwordModal}

      {/* MFA Disable Modal */}
      {disableMFAModal}
    </div>
  );
}

// Add default export for lazy loading support
export default Settings; 