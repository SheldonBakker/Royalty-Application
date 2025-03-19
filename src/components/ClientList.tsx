import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients, addCoffee, createRedemption, getSettings } from '../lib/api';
import type { Client } from '../lib/supabase';

export function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [redemptionThreshold, setRedemptionThreshold] = useState(10);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
    loadSettings();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClients();
      setClients(data);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setRedemptionThreshold(settings.redemption_threshold);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const handleAddCoffee = async (id: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(id);
      const updatedClient = await addCoffee(id);
      setClients(clients.map(client => client.id === id ? updatedClient : client));
    } catch (err) {
      console.error('Error adding coffee:', err);
      setError('Failed to add coffee');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRedeemReward = async (id: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(id);
      await createRedemption(id);
      // Refresh client list after redemption
      await loadClients();
    } catch (err: unknown) {
      console.error('Error redeeming reward:', err);
      setError(err instanceof Error ? err.message : 'Failed to redeem reward');
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone_number.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Customers</h2>
        <Link 
          to="/clients/new" 
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center transition-colors"
        >
          New Customer
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          {error}
          <button 
            className="absolute top-0 right-0 px-4 py-3" 
            onClick={() => setError(null)}
          >
            <span className="sr-only">Close</span>
            <span className="text-red-700">&times;</span>
          </button>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or phone number..."
          className="w-full p-2 border border-gray-300 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No customers found. Add a new customer to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
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
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${(client.coffees_purchased / redemptionThreshold) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{client.coffees_purchased}/{redemptionThreshold}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAddCoffee(client.id)}
                        disabled={isProcessing === client.id}
                        className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm transition-colors disabled:opacity-50"
                      >
                        {isProcessing === client.id ? 'Adding...' : '+ Coffee'}
                      </button>
                      <button
                        onClick={() => handleRedeemReward(client.id)}
                        disabled={client.coffees_purchased < redemptionThreshold || isProcessing === client.id}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded text-sm transition-colors disabled:opacity-50"
                      >
                        {isProcessing === client.id ? 'Redeeming...' : 'Redeem'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 