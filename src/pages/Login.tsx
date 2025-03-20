import { useState, FormEvent, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MFAVerify } from '../components/MFAVerify';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';

export function Login() {
  const { darkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMFAVerify, setShowMFAVerify] = useState(false);
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const navigationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  // Debounced navigation to prevent excessive redirects
  const navigateWithDebounce = useCallback((path: string) => {
    // Clear any existing navigation timeout
    if (navigationDebounceRef.current) {
      clearTimeout(navigationDebounceRef.current);
    }
    
    // Set a timeout for navigation to prevent rapid successive navigations
    navigationDebounceRef.current = setTimeout(() => {
      navigate(path);
      navigationDebounceRef.current = null;
    }, 300);
  }, [navigate]);

  // Redirect to home if already logged in, with debounce
  useEffect(() => {
    if (user && !isProcessingRef.current) {
      navigateWithDebounce('/');
    }
    
    return () => {
      // Clean up debounce timer on unmount
      if (navigationDebounceRef.current) {
        clearTimeout(navigationDebounceRef.current);
      }
    };
  }, [user, navigate, navigateWithDebounce]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (isProcessingRef.current) {
      return; // Prevent multiple submissions
    }
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      isProcessingRef.current = true;
      setError(null);
      setLoading(true);
      const { error, mfaRequired } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        isProcessingRef.current = false;
        return;
      }
      
      // If MFA is required, show the MFA verification screen
      if (mfaRequired) {
        setShowMFAVerify(true);
        isProcessingRef.current = false;
        return;
      }
      
      // Otherwise, navigate to home with debounce
      navigateWithDebounce('/');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
      isProcessingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleMFASuccess = async () => {
    // Force a session refresh to complete the authentication
    try {
      isProcessingRef.current = true;
      // Use the existing session from Supabase to refresh the UI state
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // Only navigate if we have a valid session, with debounce
        setShowMFAVerify(false);
        
        // Add a small delay before navigation to prevent rapid state changes
        setTimeout(() => {
          navigateWithDebounce('/');
          isProcessingRef.current = false;
        }, 300);
      } else {
        // If no session, show an error
        setError('Authentication failed. Please try logging in again.');
        setShowMFAVerify(false);
        isProcessingRef.current = false;
      }
    } catch (err) {
      console.error('Session refresh error:', err);
      setError('Authentication failed. Please try logging in again.');
      setShowMFAVerify(false);
      isProcessingRef.current = false;
    }
  };

  const handleMFACancel = () => {
    setShowMFAVerify(false);
    isProcessingRef.current = false;
  };

  // Show MFA verification form if required
  if (showMFAVerify) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <MFAVerify onSuccess={handleMFASuccess} onCancel={handleMFACancel} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className={`max-w-md w-full space-y-8 p-8 rounded-lg shadow-md ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
        <div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Loyalty Bean
          </h2>
          <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Sign in to manage customer loyalty
          </p>
        </div>
        
        {error && (
          <div className={`${darkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded`}>
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'border-gray-300 text-gray-900'
                }`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'border-gray-300 text-gray-900'
                }`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <Link to="/register" className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 