import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, getRedemptions, getSettings } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Client, Redemption } from '../lib/supabase';

type RedemptionWithClientInfo = Redemption & {
  clients: {
    name: string;
    phone_number: string;
  };
};

export function Dashboard() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<RedemptionWithClientInfo[]>([]);
  const [redemptionThreshold, setRedemptionThreshold] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [clientsData, redemptionsData, settingsData] = await Promise.all([
          getClients(),
          getRedemptions(),
          getSettings()
        ]);
        
        setClients(clientsData);
        setRecentRedemptions(redemptionsData.slice(0, 5)); // Only show 5 most recent
        setRedemptionThreshold(settingsData.redemption_threshold);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  const readyForRedemption = clients.filter(client => client.coffees_purchased >= redemptionThreshold).length;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.email}</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Total Customers</h2>
          <p className="text-4xl font-bold text-blue-600">{clients.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Ready for Redemption</h2>
          <p className="text-4xl font-bold text-yellow-600">{readyForRedemption}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Redemption Threshold</h2>
          <p className="text-4xl font-bold text-green-600">{redemptionThreshold}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Customers</h2>
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          
          {clients.length === 0 ? (
            <p className="text-gray-500">No customers yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coffees
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.slice(0, 5).map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/clients/${client.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {client.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          client.coffees_purchased >= redemptionThreshold 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {client.coffees_purchased}/{redemptionThreshold}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Redemptions</h2>
          </div>
          
          {recentRedemptions.length === 0 ? (
            <p className="text-gray-500">No redemptions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRedemptions.map((redemption) => (
                    <tr key={redemption.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/clients/${redemption.client_id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {redemption.clients?.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(redemption.redemption_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 