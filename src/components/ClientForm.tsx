import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient, getClientByPhone } from '../lib/api';
import type { Client } from '../lib/supabase';

type ClientFormProps = {
  existingClient?: Client;
  onSave?: (client: Client) => void;
};

export function ClientForm({ existingClient, onSave }: ClientFormProps) {
  const [name, setName] = useState(existingClient?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(existingClient?.phone_number || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name || !phoneNumber) {
      setError('Please fill in all fields');
      return;
    }
    
    // Basic phone validation (numbers only)
    if (!/^\d+$/.test(phoneNumber)) {
      setError('Phone number must contain only digits');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if phone number exists (only for new clients)
      if (!existingClient) {
        const existingClient = await getClientByPhone(phoneNumber);
        if (existingClient) {
          setError('A client with this phone number already exists');
          return;
        }
      }
      
      // Create new client
      const client = await createClient({
        name,
        phone_number: phoneNumber,
        coffees_purchased: existingClient?.coffees_purchased || 0
      });
      
      if (onSave) {
        onSave(client);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Error saving client:', err);
      setError('Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {existingClient ? 'Edit Customer' : 'New Customer'}
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1234567890"
            disabled={!!existingClient} // Can't change phone number for existing clients
          />
          <p className="text-sm text-gray-500 mt-1">
            Numbers only, no spaces or special characters
          </p>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </form>
    </div>
  );
} 