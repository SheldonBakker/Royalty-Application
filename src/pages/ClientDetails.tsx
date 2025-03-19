import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getClientById, getRedemptions, deleteClient, addCoffee, createRedemption, getSettings } from '../lib/api';
import type { Client, Redemption } from '../lib/supabase';

type RedemptionWithClientInfo = Redemption & {
  clients: {
    name: string;
    phone_number: string;
  };
};

export function ClientDetails() {
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
      navigate('/');
    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Failed to delete client');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Client not found
        </div>
        <div className="mt-4">
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            &larr; Back to customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
        <div>
          <Link to="/" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            &larr; Back to customers
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">{client.name}</h1>
          <p className="text-gray-600">Phone: {client.phone_number}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleAddCoffee}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : '+ Add Coffee'}
          </button>
          <button
            onClick={handleRedeemReward}
            disabled={client.coffees_purchased < redemptionThreshold || isProcessing}
            className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Redeem Free Coffee'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Loyalty Progress</h2>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
              <div 
                className="bg-blue-600 h-4 rounded-full"
                style={{ width: `${(client.coffees_purchased / redemptionThreshold) * 100}%` }}
              />
            </div>
            <span className="text-lg font-medium">{client.coffees_purchased}/{redemptionThreshold}</span>
          </div>
          <p className="text-gray-600">
            {client.coffees_purchased >= redemptionThreshold
              ? 'Ready for a free coffee!'
              : `${redemptionThreshold - client.coffees_purchased} more coffee${redemptionThreshold - client.coffees_purchased !== 1 ? 's' : ''} until a free reward`
            }
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Redemption History</h2>
        
        {redemptions.length === 0 ? (
          <p className="text-gray-500">No redemptions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {redemptions.map((redemption) => (
                  <tr key={redemption.id}>
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

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
        
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="bg-red-100 text-red-600 border border-red-300 py-2 px-4 rounded hover:bg-red-200 transition-colors"
          >
            Delete Customer
          </button>
        ) : (
          <div>
            <p className="mb-4 text-gray-700">
              Are you sure you want to delete this customer? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setConfirmDelete(false)}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={isProcessing}
                className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 