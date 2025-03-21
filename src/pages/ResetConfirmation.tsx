import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';

export function ResetConfirmation() {
  const { darkMode } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        return;
      }
      
      setSuccess('Your password has been reset successfully.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full ${darkMode ? 'bg-blue-800/10' : 'bg-blue-200/40'} blur-3xl animate-pulse-slow`}></div>
        <div className={`absolute top-1/2 -left-24 w-72 h-72 rounded-full ${darkMode ? 'bg-indigo-800/10' : 'bg-indigo-200/40'} blur-3xl animate-pulse-slower`}></div>
        <div className={`absolute -bottom-24 right-1/3 w-80 h-80 rounded-full ${darkMode ? 'bg-purple-800/10' : 'bg-purple-200/40'} blur-3xl animate-pulse-slow`}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:40px_40px] opacity-20"></div>
      </div>

      <div className={`max-w-md w-full space-y-6 ${darkMode ? 'bg-gray-800/90 border border-gray-700/70' : 'bg-white/90 border border-gray-200/70'} p-8 rounded-xl shadow-xl backdrop-blur-sm transition-all duration-500 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        {/* Brand logo/icon */}
        <div className={`flex justify-center transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className={`w-16 h-16 rounded-full ${darkMode ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} flex items-center justify-center shadow-lg`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
        </div>
      
        <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h2 className={`mt-2 text-center text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <span className="inline-block relative">
              New
              <span className={`absolute -bottom-1 left-0 w-full h-1 ${darkMode ? 'bg-blue-700/50' : 'bg-blue-500/30'} rounded-full transform scale-x-0 ${isLoaded ? 'scale-x-100' : ''} transition-transform duration-1000 delay-300`}></span>
            </span>
            <span className={`inline-block ml-2 bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-400 via-indigo-400 to-purple-400' : 'from-blue-600 via-indigo-600 to-purple-600'}`}>Password</span>
          </h2>
          <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Create a new password for your account
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
        
        {success && (
          <div className={`${darkMode ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-100 border-green-400 text-green-700'} border px-4 py-3 rounded-lg transition-all duration-300 animate-fade-in-down`}>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}
        
        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div className={`transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <label htmlFor="password" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                New Password
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className={`transition-all duration-700 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
                  Updating...
                </span>
              ) : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
