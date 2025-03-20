import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClients, addCoffee, createRedemption, getSettings, getCreditBalance } from '../lib/api';
import toast from 'react-hot-toast';
import type { Client } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import { CreditBalanceWarning } from './CreditBalanceWarning';

export function ClientList() {
  const { darkMode } = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [redemptionThreshold, setRedemptionThreshold] = useState(10);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const isLoadingSettingsRef = useRef(false);
  const isMountedRef = useRef(true);
  const navigate = useNavigate();
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // Separate data loading functions with error handling
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load credit balance first
      const balance = await getCreditBalance();
      setCreditBalance(balance);
      
      // Only load clients if there's credit balance
      if (balance > 0) {
        const data = await getClients();
        if (isMountedRef.current) {
          setClients(data);
        }
      }
    } catch (err) {
      console.error('Error loading clients:', err);
      if (isMountedRef.current) {
        setError('Failed to load clients');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const loadSettings = useCallback(async () => {
    // Use ref instead of state to avoid re-renders
    if (isLoadingSettingsRef.current) return;
    
    try {
      isLoadingSettingsRef.current = true;
      const settings = await getSettings();
      
      // Check if component is still mounted
      if (isMountedRef.current) {
        setRedemptionThreshold(settings.redemption_threshold);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      // Don't set error state for settings issues
    } finally {
      isLoadingSettingsRef.current = false;
    }
  }, []);
  
  // Run data loading on component mount
  useEffect(() => {
    // Set mount state
    isMountedRef.current = true;
    
    // Parallel loading of data
    Promise.all([
      loadClients(),
      loadSettings()
    ]).catch(err => {
      console.error('Error loading initial data:', err);
    });
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [loadClients, loadSettings]);

  const handleAddCoffee = async (id: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(id);
      
      // Find the client
      const clientIndex = clients.findIndex(client => client.id === id);
      if (clientIndex === -1) return;
      
      // Create a new array with the optimistic update
      const updatedClients = [...clients];
      updatedClients[clientIndex] = {
        ...updatedClients[clientIndex],
        coffees_purchased: (updatedClients[clientIndex].coffees_purchased || 0) + 1
      };
      
      // Update UI immediately
      setClients(updatedClients);
      
      // Perform actual server update
      const updatedClient = await addCoffee(id);
      
      // Update with server response (in case something was different)
      if (isMountedRef.current) {
        setClients(current => 
          current.map(client => client.id === id ? updatedClient : client)
        );
      }
    } catch (err) {
      console.error('Error adding Unit:', err);
      
      if (isMountedRef.current) {
        // Check if it's a credit balance error
        if (err instanceof Error && err.message.includes('Insufficient credit balance')) {
          // Show toast with action button
          toast.error(
            (t) => (
              <div className="text-center">
                <p className="text-base font-medium mb-3">Insufficient credit balance</p>
                <div className="mt-4 flex justify-center">
                  <button 
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate('/payment');
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded shadow-sm text-base w-full max-w-xs transition-colors"
                  >
                    Add Credit
                  </button>
                </div>
              </div>
            ),
            { 
              duration: 10000,
              style: {
                maxWidth: '90vw',
                width: '400px',
                padding: '20px',
                whiteSpace: 'normal'
              }
            }
          );
        } else {
          // Show regular error for other types of errors
          setError('Failed to add Unit');
        }
        
        // Revert optimistic update
        await loadClients();
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(null);
      }
    }
  };

  const handleRedeemReward = async (id: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(id);
      
      // Find the client
      const clientIndex = clients.findIndex(client => client.id === id);
      if (clientIndex === -1) return;
      
      // Create a new array with the optimistic update
      const updatedClients = [...clients];
      updatedClients[clientIndex] = {
        ...updatedClients[clientIndex],
        coffees_purchased: 0
      };
      
      // Update UI immediately
      setClients(updatedClients);
      
      // Perform actual server update
      await createRedemption(id);
    } catch (err: unknown) {
      console.error('Error redeeming reward:', err);
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to redeem reward';
        
        // Check if it's a credit balance error
        if (err instanceof Error && (
          err.message.includes('Insufficient credit balance') || 
          err.message.includes('credit')
        )) {
          // Show toast with action button
          toast.error(
            (t) => (
              <div className="text-center">
                <p className="text-base font-medium mb-3">Insufficient credit balance</p>
                <div className="mt-4 flex justify-center">
                  <button 
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate('/payment');
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded shadow-sm text-base w-full max-w-xs transition-colors"
                  >
                    Add Credit
                  </button>
                </div>
              </div>
            ),
            { 
              duration: 10000,
              style: {
                maxWidth: '90vw',
                width: '400px',
                padding: '20px',
                whiteSpace: 'normal'
              }
            }
          );
        } else {
          // Show regular error for other types of errors
          setError(errorMessage);
        }
        
        // Revert optimistic update
        await loadClients();
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessing(null);
      }
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone_number.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
        </div>
      </div>
    );
  }

  // Add credit balance check
  if (creditBalance !== null && creditBalance <= 0) {
    return <CreditBalanceWarning />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Sticky Header */}
      <div className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h2 className={`text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-0 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Customers
            </h2>
            <Link 
              to="/clients/new" 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-2.5 px-6 rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-center"
            >
              Add New Customer
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 pt-24">
        {error && (
          <div className={`${darkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 p-4 rounded-lg shadow-md mb-6 relative`}>
            <p className="font-medium">{error}</p>
            <button 
              className={`absolute top-2 right-2 ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-700 hover:text-red-900'}`} 
              onClick={() => setError(null)}
            >
              <span className="sr-only">Close</span>
              <span className="text-xl">&times;</span>
            </button>
          </div>
        )}

        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or phone number..."
            className={`w-full pl-10 p-3 border rounded-lg shadow-sm transition-colors duration-200 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredClients.length === 0 ? (
          <div className={`text-center p-12 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'} rounded-xl shadow-sm border transition-colors duration-200`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mx-auto ${darkMode ? 'text-gray-600' : 'text-gray-400'} mb-4`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>No customers found. Add a new customer to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table - Hidden on Mobile */}
            <div className="hidden md:block overflow-hidden rounded-xl shadow-xl border transition-colors duration-200" 
              style={{ backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)' }}>
              <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead>
                  <tr className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                    <th scope="col" className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                      Name
                    </th>
                    <th scope="col" className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                      Phone Number
                    </th>
                    <th scope="col" className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                      Loyalty Status
                    </th>
                    <th scope="col" className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}`}>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors duration-150`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/clients/${client.id}`} className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                          {client.name}
                        </Link>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {client.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 mr-2 overflow-hidden transition-colors duration-200`}>
                            <div 
                              className={`h-2.5 rounded-full ${
                                client.coffees_purchased >= redemptionThreshold
                                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                              }`}
                              style={{ width: `${Math.min((client.coffees_purchased / redemptionThreshold) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              client.coffees_purchased >= redemptionThreshold
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : darkMode ? 'text-gray-300' : 'text-gray-700'
                            } transition-colors duration-200`}>
                              {client.coffees_purchased}/{redemptionThreshold}
                            </span>
                            {client.coffees_purchased >= redemptionThreshold && (
                              <span className={`ml-2 px-2 py-0.5 text-xs font-medium ${darkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-800'} rounded-full transition-colors duration-200`}>Ready!</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleAddCoffee(client.id)}
                            disabled={isProcessing === client.id}
                            className={`inline-flex items-center py-1.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isProcessing === client.id 
                                ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow hover:shadow-md hover:-translate-y-0.5'
                            }`}
                          >
                            {isProcessing === client.id ? (
                              <>
                                <svg className={`animate-spin -ml-1 mr-2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Adding...
                              </>
                            ) : (
                              <>
                                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Unit
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRedeemReward(client.id)}
                            disabled={client.coffees_purchased < redemptionThreshold || isProcessing === client.id}
                            className={`inline-flex items-center py-1.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                              client.coffees_purchased < redemptionThreshold || isProcessing === client.id
                                ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow hover:shadow-md hover:-translate-y-0.5'
                            }`}
                          >
                            {isProcessing === client.id ? (
                              <>
                                <svg className={`animate-spin -ml-1 mr-2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Redeeming...
                              </>
                            ) : (
                              <>
                                <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M18.5 8H5.5C4.67157 8 4 8.67157 4 9.5V10.5C4 11.3284 4.67157 12 5.5 12H7.16667L8.41667 21H15.5833L16.8333 12H18.5C19.3284 12 20 11.3284 20 10.5V9.5C20 8.67157 19.3284 8 18.5 8Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M9 12L10 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M14 12L15 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M10.5 4C10.5 4.55228 10.0523 5 9.5 5C8.94772 5 8.5 4.55228 8.5 4C8.5 3.44772 8.94772 3 9.5 3C10.0523 3 10.5 3.44772 10.5 4Z" strokeWidth="1.5"/>
                                  <path d="M15.5 4C15.5 4.55228 15.0523 5 14.5 5C13.9477 5 13.5 4.55228 13.5 4C13.5 3.44772 13.9477 3 14.5 3C15.0523 3 15.5 3.44772 15.5 4Z" strokeWidth="1.5"/>
                                </svg>
                                Redeem
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  className={`${darkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'} 
                    rounded-xl shadow-md border p-4`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <Link 
                      to={`/clients/${client.id}`} 
                      className={`font-medium text-lg ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} hover:underline transition-colors duration-200`}
                    >
                      {client.name}
                    </Link>
                    {client.coffees_purchased >= redemptionThreshold && (
                      <span className={`px-2 py-0.5 text-xs font-medium ${darkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-800'} rounded-full transition-colors duration-200`}>
                        Ready!
                      </span>
                    )}
                  </div>
                  
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3 flex items-center`}>
                    <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    {client.phone_number}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Loyalty Status
                      </span>
                      <span className={`text-sm font-medium ${
                        client.coffees_purchased >= redemptionThreshold
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : darkMode ? 'text-gray-300' : 'text-gray-700'
                      } transition-colors duration-200`}>
                        {client.coffees_purchased}/{redemptionThreshold}
                      </span>
                    </div>
                    <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5 overflow-hidden transition-colors duration-200`}>
                      <div 
                        className={`h-2.5 rounded-full ${
                          client.coffees_purchased >= redemptionThreshold
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        }`}
                        style={{ width: `${Math.min((client.coffees_purchased / redemptionThreshold) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddCoffee(client.id)}
                      disabled={isProcessing === client.id}
                      className={`flex-1 inline-flex items-center justify-center py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isProcessing === client.id 
                          ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                          : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {isProcessing === client.id ? (
                        <>
                          <svg className={`animate-spin -ml-1 mr-2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        <>
                          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                          Add Unit
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRedeemReward(client.id)}
                      disabled={client.coffees_purchased < redemptionThreshold || isProcessing === client.id}
                      className={`flex-1 inline-flex items-center justify-center py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        client.coffees_purchased < redemptionThreshold || isProcessing === client.id
                          ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                          : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {isProcessing === client.id ? (
                        <>
                          <svg className={`animate-spin -ml-1 mr-2 h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Redeeming...
                        </>
                      ) : (
                        <>
                          <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18.5 8H5.5C4.67157 8 4 8.67157 4 9.5V10.5C4 11.3284 4.67157 12 5.5 12H7.16667L8.41667 21H15.5833L16.8333 12H18.5C19.3284 12 20 11.3284 20 10.5V9.5C20 8.67157 19.3284 8 18.5 8Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 12L10 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 12L15 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10.5 4C10.5 4.55228 10.0523 5 9.5 5C8.94772 5 8.5 4.55228 8.5 4C8.5 3.44772 8.94772 3 9.5 3C10.0523 3 10.5 3.44772 10.5 4Z" strokeWidth="1.5"/>
                            <path d="M15.5 4C15.5 4.55228 15.0523 5 14.5 5C13.9477 5 13.5 4.55228 13.5 4C13.5 3.44772 13.9477 3 14.5 3C15.0523 3 15.5 3.44772 15.5 4Z" strokeWidth="1.5"/>
                          </svg>
                          Redeem
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 