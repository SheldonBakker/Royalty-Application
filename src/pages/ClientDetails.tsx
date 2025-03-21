import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getClientById, getRedemptions, deleteClient, addCoffee, createRedemption, getSettings } from '../lib/api';
import type { Client, Redemption } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';
import AppLayout from '../components/AppLayout';

type RedemptionWithClientInfo = Redemption & {
  clients: {
    name: string;
    phone_number: string;
  };
};

export function ClientDetails() {
  const { darkMode } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionWithClientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redemptionThreshold, setRedemptionThreshold] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [clientData, redemptionsData, settings] = await Promise.all([
          getClientById(id),
          getRedemptions(id),
          getSettings()
        ]);
        
        setClient(clientData);
        setRedemptions(redemptionsData);
        setRedemptionThreshold(settings.redemption_threshold);
      } catch (err) {
        console.error('Error loading client data:', err);
        setError('Failed to load client data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id]);

  const handleAddCoffee = async () => {
    if (!client || isProcessing) return;
    
    // Prevent adding more units if the redemption threshold has been reached
    if (client.coffees_purchased >= redemptionThreshold) {
      setError('Customer has already reached the redemption threshold. Please redeem the reward first.');
      return;
    }
    
    try {
      setIsProcessing(true);
      const updatedClient = await addCoffee(client.id);
      setClient(updatedClient);
    } catch (err) {
      console.error('Error adding coffee:', err);
      setError('Failed to add coffee');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!client || isProcessing) return;
    
    try {
      setIsProcessing(true);
      await createRedemption(client.id);
      // Reload client and redemptions
      const [updatedClient, updatedRedemptions] = await Promise.all([
        getClientById(client.id),
        getRedemptions(client.id)
      ]);
      setClient(updatedClient);
      setRedemptions(updatedRedemptions);
    } catch (err: unknown) {
      console.error('Error redeeming reward:', err);
      setError(err instanceof Error ? err.message : 'Failed to redeem reward');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!client || isProcessing) return;
    
    try {
      setIsProcessing(true);
      await deleteClient(client.id);
      navigate('/customers');
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client');
      setIsProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} min-h-screen transition-colors duration-200`}>
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className={`${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-100 border-red-400'} border-l-4 p-4 max-w-md`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : client ? (
          <div className="container mx-auto px-4 py-6">
            {/* Sticky Header */}
            <div className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} -mx-4 px-4 py-4 mb-6`}>
              <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                  <Link to="/customers" className={`inline-flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-800'} transition-colors mb-3`}>
                    <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    Back to customers
                  </Link>
                  <h1 className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
                    {client.name}
                  </h1>
                  <div className={`mt-2 inline-flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors duration-200`}>
                    <svg className={`h-5 w-5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    {client.phone_number}
                  </div>
                </div>
                
                <div className="mt-6 sm:mt-0 flex space-x-3">
                  <button
                    onClick={handleAddCoffee}
                    disabled={isProcessing || client.coffees_purchased >= redemptionThreshold}
                    className={`inline-flex items-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isProcessing || client.coffees_purchased >= redemptionThreshold
                        ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add Unit
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleRedeemReward}
                    disabled={isProcessing || client.coffees_purchased < redemptionThreshold}
                    className={`inline-flex items-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isProcessing || client.coffees_purchased < redemptionThreshold
                        ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                        : `${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow hover:shadow-md hover:-translate-y-0.5`
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Redeem Reward
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 pt-24"> {/* Increased padding-top */}
              {error && (
                <div className={`${darkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 p-4 rounded-lg shadow-md mb-6 relative`}>
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                {/* Loyalty Card */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-2xl shadow-lg border p-8 hover:shadow-xl transition-shadow`}>
                  <div className="flex items-center mb-5">
                    <svg className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-indigo-600'} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                    </svg>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loyalty Card</h2>
                  </div>
                  
                  <div className="mb-6">
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {Array.from({ length: redemptionThreshold }).map((_, index) => (
                          <div 
                            key={index}
                            className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                              index < client.coffees_purchased 
                                ? 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md' 
                                : darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {index < client.coffees_purchased ? (
                              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                            ) : (
                              <svg className={`h-6 w-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                              </svg>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className={`h-2 w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full mb-2 overflow-hidden`}>
                        <div 
                          className={`h-full rounded-full ${
                            client.coffees_purchased >= redemptionThreshold
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          }`}
                          style={{ width: `${Math.min((client.coffees_purchased / redemptionThreshold) * 100, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {client.coffees_purchased}
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} font-normal text-lg`}>/{redemptionThreshold}</span>
                        </div>
                        
                        <div>
                          {client.coffees_purchased >= redemptionThreshold ? (
                            <div className={`px-3 py-1 ${darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800'} rounded-full font-medium text-sm inline-flex items-center`}>
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                              </svg>
                              Ready for Redemption!
                            </div>
                          ) : (
                            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {redemptionThreshold - client.coffees_purchased} more to go
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Redemption History */}
                <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-2xl shadow-lg border p-8 hover:shadow-xl transition-shadow`}>
                  <div className="flex items-center mb-5">
                    <svg className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-indigo-600'} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                    </svg>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Redemption History</h2>
                  </div>
                  
                  {redemptions.length === 0 ? (
                    <div className="py-8 text-center">
                      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <svg className={`h-10 w-10 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                        </svg>
                      </div>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-lg`}>No redemptions yet</p>
                      <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm mt-1`}>Purchases will appear here after redemption</p>
                    </div>
                  ) : (
                    <div className={`overflow-hidden rounded-xl ${darkMode ? 'border-gray-700' : 'border-gray-100'} border`}>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className={`${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-gray-50 to-white'}`}>
                            <th className={`px-6 py-3 text-left text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>
                              Redeemed On
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-100'}`}>
                          {redemptions.map((redemption) => (
                            <tr key={redemption.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                              <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <div className="flex items-center">
                                  <svg className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-500'} mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                                  </svg>
                                  {new Date(redemption.redemption_date).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-2xl shadow-lg border p-8 hover:shadow-xl transition-shadow`}>
                <div className="flex items-center mb-5">
                  <svg className="h-8 w-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Account Management</h2>
                </div>
                
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className={`mt-2 inline-flex items-center px-4 py-2.5 ${darkMode ? 'border-red-600 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-50'} border text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete Customer Account
                  </button>
                ) : (
                  <div className={`mt-4 ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-100'} border rounded-lg p-4`}>
                    <div className="flex items-center mb-3">
                      <svg className={`h-6 w-6 ${darkMode ? 'text-red-400' : 'text-red-600'} mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Confirm Deletion</h3>
                    </div>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'} ml-8`}>
                      Are you sure you want to delete this customer? This action cannot be undone and all loyalty data will be lost.
                    </p>
                    <div className="flex space-x-4 ml-8">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className={`px-4 py-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'} border rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteClient}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                          isProcessing 
                            ? `${darkMode ? 'bg-gray-600' : 'bg-gray-300'} cursor-not-allowed` 
                            : `${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600 hover:bg-red-700'} transition-colors`
                        }`}
                      >
                        {isProcessing ? 'Deleting...' : 'Yes, Delete Customer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
} 