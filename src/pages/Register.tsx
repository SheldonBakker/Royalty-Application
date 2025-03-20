import { useState, FormEvent, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import Footer from '../components/Footer';

export function Register() {
  const { darkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const navigationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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

  // Redirect to settings if already logged in, with debounce
  useEffect(() => {
    if (user && !isProcessingRef.current) {
      navigateWithDebounce('/settings');
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
    
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      isProcessingRef.current = true;
      setError(null);
      setLoading(true);
      
      const { error, data } = await signUp(email, password);
      
      if (error) {
        console.error('Signup error:', error);
        setError(error.message);
        isProcessingRef.current = false;
        return;
      }

      // Check if the user was created but needs to confirm their email
      if (data?.user && data?.session === null) {
        setSuccessMessage('Registration successful! Please check your email to confirm your account.');
        setTimeout(() => {
          navigateWithDebounce('/login');
          isProcessingRef.current = false;
        }, 3000);
        return;
      }

      // If we get here and have a session, navigate to settings
      if (data?.session) {
        navigateWithDebounce('/settings');
        isProcessingRef.current = false;
        return;
      }

      // If we get here, something unexpected happened
      setError('An unexpected error occurred during signup. Please try again.');
      isProcessingRef.current = false;
      
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      isProcessingRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full ${darkMode ? 'bg-blue-800/10' : 'bg-blue-200/40'} blur-3xl animate-pulse-slow`}></div>
        <div className={`absolute top-1/2 -left-24 w-72 h-72 rounded-full ${darkMode ? 'bg-indigo-800/10' : 'bg-indigo-200/40'} blur-3xl animate-pulse-slower`}></div>
        <div className={`absolute -bottom-24 right-1/3 w-80 h-80 rounded-full ${darkMode ? 'bg-purple-800/10' : 'bg-purple-200/40'} blur-3xl animate-pulse-slow`}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px] opacity-20"></div>
        
        {/* Premium floating elements */}
        <div className={`absolute top-20 right-[20%] w-16 h-16 rounded-full ${darkMode ? 'bg-blue-600/30' : 'bg-blue-400/20'} backdrop-blur-sm animate-float-slow hidden lg:block`}></div>
        <div className={`absolute top-40 left-[15%] w-8 h-8 rounded-md ${darkMode ? 'bg-purple-600/30' : 'bg-purple-400/20'} backdrop-blur-sm rotate-45 animate-float-slower hidden lg:block`}></div>
        <div className={`absolute bottom-32 right-[35%] w-12 h-12 rounded-lg ${darkMode ? 'bg-indigo-600/30' : 'bg-indigo-400/20'} backdrop-blur-sm animate-float hidden lg:block`}></div>
      </div>

      <div className={`max-w-md w-full space-y-6 ${darkMode ? 'bg-gray-800/90 border border-gray-700/70' : 'bg-white/90 border border-gray-200/70'} p-8 rounded-xl shadow-xl backdrop-blur-sm transition-all duration-500 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        {/* Brand logo/icon */}
        <div className={`flex justify-center transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className={`w-16 h-16 rounded-full ${darkMode ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} flex items-center justify-center shadow-lg`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>
        
        <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h2 className={`mt-2 text-center text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <span className="inline-block relative">
              Create
              <span className={`absolute -bottom-1 left-0 w-full h-1 ${darkMode ? 'bg-blue-700/50' : 'bg-blue-500/30'} rounded-full transform scale-x-0 ${isLoaded ? 'scale-x-100' : ''} transition-transform duration-1000 delay-300`}></span>
            </span>
            <span className={`inline-block ml-2 bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-400 via-indigo-400 to-purple-400' : 'from-blue-600 via-indigo-600 to-purple-600'}`}>Account</span>
          </h2>
          <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Register to manage customer loyalty
          </p>
        </div>
        
        {error && (
          <div className={`${darkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded-lg transition-all duration-300 animate-fade-in-down`}>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className={`${darkMode ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-100 border-green-400 text-green-700'} border px-4 py-3 rounded-lg transition-all duration-300 animate-fade-in-down`}>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div className={`transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <label htmlFor="email-address" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Email address
              </label>
              <div className="relative group">
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -m-0.5 blur-sm"></div>
                <div className="relative">
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    required
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      darkMode 
                        ? 'bg-gray-700/80 border-gray-600 text-gray-100 placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900 bg-white/80 placeholder-gray-500'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm backdrop-blur-sm transition-all duration-200`}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className={`transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <label htmlFor="password" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -m-0.5 blur-sm"></div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      darkMode 
                        ? 'bg-gray-700/80 border-gray-600 text-gray-100 placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900 bg-white/80 placeholder-gray-500'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm backdrop-blur-sm transition-all duration-200`}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Must be at least 6 characters
              </p>
            </div>
            
            <div className={`transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <label htmlFor="confirm-password" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -m-0.5 blur-sm"></div>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    required
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      darkMode 
                        ? 'bg-gray-700/80 border-gray-600 text-gray-100 placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900 bg-white/80 placeholder-gray-500'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm backdrop-blur-sm transition-all duration-200`}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-700 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : 'Create Account'}
            </button>
          </div>
          
          <div className={`mt-6 flex items-center justify-center transition-all duration-700 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className={`h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} flex-grow max-w-[80px]`}></div>
            <span className={`px-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>OR</span>
            <div className={`h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} flex-grow max-w-[80px]`}></div>
          </div>
          
          <div className={`text-sm text-center transition-all duration-700 delay-800 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link 
              to="/login" 
              className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors duration-200 flex items-center justify-center`}
            >
              <span>Already have an account?</span>
              <span className="ml-1 group-hover:ml-2 transition-all duration-300 font-semibold">Sign in</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </form>
      </div>

      <div className="absolute w-full bottom-0">
        <Footer variant="simple" />
      </div>
    </div>
  );
} 