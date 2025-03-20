import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { usePayment } from '../hooks/usePayment';
import { PaymentModal } from './PaymentModal';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { openPaymentModal } = usePayment();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.hash === '#' + path;
  };

  return (
    <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-200`}>
      {/* Top Navigation Bar */}
      <nav className={`${darkMode ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-md'} transition-colors duration-200`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className={`text-xl font-bold flex items-center ${darkMode ? 'text-blue-400' : 'text-blue-600'} transition-colors duration-200`}>
                  <img src="/favicon.svg" className="h-6 w-6 mr-2" alt="Loyalty Bean logo" />
                  Loyalty Bean
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive('/') 
                      ? darkMode 
                        ? 'border-blue-400 text-white' 
                        : 'border-blue-500 text-gray-900' 
                      : darkMode
                        ? 'border-transparent text-gray-300 hover:border-gray-600 hover:text-gray-200'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={(e) => {
                    if (location.hash === '#/') {
                      e.preventDefault();
                    } else {
                      e.preventDefault();
                      navigate('/');
                    }
                  }}
                >
                  Customers
                </Link>
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive('/dashboard') 
                      ? darkMode 
                        ? 'border-blue-400 text-white' 
                        : 'border-blue-500 text-gray-900' 
                      : darkMode
                        ? 'border-transparent text-gray-300 hover:border-gray-600 hover:text-gray-200'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={(e) => {
                    if (location.hash === '#/dashboard') {
                      e.preventDefault();
                    } else {
                      e.preventDefault();
                      navigate('/dashboard');
                    }
                  }}
                >
                  Dashboard
                </Link>
                <Link
                  to="/settings"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive('/settings') 
                      ? darkMode 
                        ? 'border-blue-400 text-white' 
                        : 'border-blue-500 text-gray-900' 
                      : darkMode
                        ? 'border-transparent text-gray-300 hover:border-gray-600 hover:text-gray-200'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={(e) => {
                    if (location.hash === '#/settings') {
                      console.log('Preventing navigation to current page');
                      e.preventDefault();
                    } else {
                      console.log('Navigating to settings');
                      e.preventDefault();
                      navigate('/settings');
                    }
                  }}
                >
                  Settings
                </Link>
                <Link
                  to="/about"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive('/about') 
                      ? darkMode 
                        ? 'border-blue-400 text-white' 
                        : 'border-blue-500 text-gray-900' 
                      : darkMode
                        ? 'border-transparent text-gray-300 hover:border-gray-600 hover:text-gray-200'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={(e) => {
                    if (location.hash === '#/about') {
                      e.preventDefault();
                    } else {
                      e.preventDefault();
                      navigate('/about');
                    }
                  }}
                >
                  About
                </Link>
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {/* Theme toggle button */}
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  // Sun icon for dark mode
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // Moon icon for light mode
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              {user ? (
                <div className="relative ml-3 flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={openPaymentModal}
                    className={`inline-flex items-center px-3 py-2 border ${
                      darkMode 
                        ? 'border-blue-500 text-blue-400 bg-blue-900/20 hover:bg-blue-900/30' 
                        : 'border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100'
                    } text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Add Credits
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center px-3 py-2 border ${
                      darkMode 
                        ? 'border-gray-700 text-gray-300 bg-gray-800 hover:text-white' 
                        : 'border-transparent text-gray-500 bg-white hover:text-gray-700'
                    } text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
                    darkMode 
                      ? 'text-white bg-blue-600 hover:bg-blue-700' 
                      : 'text-white bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}
                >
                  Sign in
                </Link>
              )}
            </div>
            
            <div className="-mr-2 flex items-center sm:hidden">
              {/* Mobile theme toggle */}
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full mr-2 ${darkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} focus:outline-none transition-colors duration-200`}
                aria-label="Toggle theme"
              >
                {darkMode ? (
                  // Sun icon for dark mode
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // Moon icon for light mode
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            
              <button
                type="button"
                className={`inline-flex items-center justify-center p-2 rounded-md ${
                  darkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
                } focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200`}
                aria-expanded="false"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {/* Hamburger icon */}
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* X icon */}
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-200`}>
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                isActive('/') 
                  ? darkMode
                    ? 'bg-gray-900 border-blue-400 text-blue-400'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : darkMode
                    ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-gray-200'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={(e) => {
                setIsMenuOpen(false);
                if (location.hash === '#/') {
                  e.preventDefault();
                } else {
                  e.preventDefault();
                  navigate('/');
                }
              }}
            >
              Customers
            </Link>
            <Link
              to="/dashboard"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                isActive('/dashboard') 
                  ? darkMode
                    ? 'bg-gray-900 border-blue-400 text-blue-400'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : darkMode
                    ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-gray-200'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={(e) => {
                setIsMenuOpen(false);
                if (location.hash === '#/dashboard') {
                  e.preventDefault();
                } else {
                  e.preventDefault();
                  navigate('/dashboard');
                }
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/settings"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                isActive('/settings') 
                  ? darkMode
                    ? 'bg-gray-900 border-blue-400 text-blue-400'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : darkMode
                    ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-gray-200'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={(e) => {
                setIsMenuOpen(false);
                if (location.hash === '#/settings') {
                  console.log('Preventing navigation to current page (mobile)');
                  e.preventDefault();
                } else {
                  console.log('Navigating to settings (mobile)');
                  e.preventDefault();
                  navigate('/settings');
                }
              }}
            >
              Settings
            </Link>
            <Link
              to="/about"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                isActive('/about') 
                  ? darkMode
                    ? 'bg-gray-900 border-blue-400 text-blue-400'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : darkMode
                    ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-gray-200'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={(e) => {
                setIsMenuOpen(false);
                if (location.hash === '#/about') {
                  e.preventDefault();
                } else {
                  e.preventDefault();
                  navigate('/about');
                }
              }}
            >
              About
            </Link>
            {user && (
              <button
                type="button"
                onClick={openPaymentModal}
                className={`w-full text-left px-3 py-2 text-base font-medium ${
                  darkMode 
                    ? 'text-blue-400 hover:bg-blue-900/20 hover:text-blue-300' 
                    : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                } transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Add Credits
                </div>
              </button>
            )}
          </div>
          <div className={`pt-4 pb-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-200`}>
            {user ? (
              <div className="flex items-center px-4">
                <div className="ml-3">
                  <div className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-800'} transition-colors duration-200`}>{user.email}</div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className={`mt-3 block w-full px-4 py-2 text-base font-medium ${
                      darkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                    } transition-colors duration-200`}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center px-4">
                <Link
                  to="/login"
                  className={`block px-4 py-2 text-base font-medium ${
                    darkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  } transition-colors duration-200`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <PaymentModal />
    </div>
  );
} 