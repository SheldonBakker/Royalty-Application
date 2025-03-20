import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getClients, getRedemptions, getSettings, getCreditBalance } from '../lib/api';
import type { Client, Redemption } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/useTheme';
import { CreditBalanceWarning } from '../components/CreditBalanceWarning';

type RedemptionWithClient = Redemption & { 
  clients?: { 
    name: string; 
    phone_number: string 
  } 
};

export const Dashboard: React.FC = () => {
  useAuth();
  const { darkMode } = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<RedemptionWithClient[]>([]);
  const [redemptionThreshold, setRedemptionThreshold] = useState(10);
  const [totalCoffees, setTotalCoffees] = useState(0);
  const [readyForRedemption, setReadyForRedemption] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load credit balance first
      const balance = await getCreditBalance();
      setCreditBalance(balance);
      
      // Only load other data if there's credit balance
      if (balance > 0) {
        // Load clients
        const clientsData = await getClients();
        setClients(clientsData);
        
        // Calculate clients ready for redemption
        const readyCount = clientsData.filter(client => 
          client.coffees_purchased >= redemptionThreshold
        ).length;
        setReadyForRedemption(readyCount);
        
        // Load redemptions
        const redemptionsData = await getRedemptions();
        setRecentRedemptions(redemptionsData as RedemptionWithClient[]);
        
        // Load settings
        const settingsData = await getSettings();
        setRedemptionThreshold(settingsData.redemption_threshold);
        setTotalCoffees(settingsData.total_coffees_purchased || 0);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [redemptionThreshold]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
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
      <div className="px-4 py-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md mb-6 relative">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
            <div className="flex items-center mb-4">
              <div className={`${darkMode ? 'bg-blue-900/20' : 'bg-blue-100'} p-3 rounded-full mr-4 shadow-sm`}>
                <svg className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active Clients</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
                  {clients.length}
                </p>
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
            <div className="flex items-center mb-4">
              <div className={`${darkMode ? 'bg-green-900/20' : 'bg-green-100'} p-3 rounded-full mr-4 shadow-sm`}>
                <svg className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Redeemed</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-green-700">
                  {recentRedemptions.length}
                </p>
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
            <div className="flex items-center mb-4">
              <div className={`${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-100'} p-3 rounded-full mr-4 shadow-sm`}>
                <svg className={`w-6 h-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ready for Redemption</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-yellow-700">
                  {readyForRedemption}
                </p>
              </div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
            <div className="flex items-center mb-4">
              <div className={`${darkMode ? 'bg-orange-900/20' : 'bg-orange-100'} p-3 rounded-full mr-4 shadow-sm`}>
                <svg className={`w-6 h-6 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Monthly Units Sold</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-700">
                  {totalCoffees}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
            <div className="flex items-center mb-5">
              <svg className={`h-8 w-8 mr-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Recent Clients</h2>
            </div>
            
            {clients.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {clients.slice(0, 5).map(client => (
                  <li key={client.id} className={`py-4 rounded-lg px-2`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <Link to={`/clients/${client.id}`} className={`font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-700 hover:text-indigo-900'} transition-colors`}>
                          {client.name}
                        </Link>
                        <div className={`flex items-center text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                          </svg>
                          {client.phone_number}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end">
                          <svg className="h-5 w-5 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                          </svg>
                          <span className="font-medium text-gray-800">{client.coffees_purchased}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{Math.floor(client.coffees_purchased / redemptionThreshold)} redeemed</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <svg className={`h-10 w-10 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-lg`}>No clients yet</p>
                <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm mt-1`}>Add your first customer to get started</p>
              </div>
            )}
          </div>
          
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200`}>
            <div className="flex items-center mb-5">
              <svg className={`h-8 w-8 mr-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
              </svg>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>Recent Redemptions</h2>
            </div>
            
            {recentRedemptions.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentRedemptions.slice(0, 5).map(redemption => (
                  <li key={redemption.id} className={`py-4 rounded-lg px-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                          </svg>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {redemption.clients?.name || `Client #${redemption.client_id.substring(0, 8)}`}
                          </p>
                        </div>

                        {redemption.clients?.phone_number && (
                          <div className={`flex items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 ml-7`}>
                            <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            {redemption.clients.phone_number}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                        <svg className="h-4 w-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span className="text-xs text-green-800 font-medium">
                          {new Date(redemption.redemption_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center">
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <svg className={`h-10 w-10 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 4h2a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H10a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2zM12 14v4"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 14v1a4 4 0 01-8 0v-1"></path>
                  </svg>
                </div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-lg`}>No redemptions yet</p>
                <p className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm mt-1`}>Redemptions will appear here when customers earn free items</p>
              </div>
            )}
                      </div>
        </div>
      </div>
    </div>
  );
};

// Providing a default export for backward compatibility
export default Dashboard; 