import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient, getClientByPhone } from '../lib/api';
import type { Client } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';

type ClientFormProps = {
  existingClient?: Client;
  onSave?: (client: Client) => void;
};

export function ClientForm({ existingClient, onSave }: ClientFormProps) {
  const { darkMode } = useTheme();
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
    
    if (!/^\d+$/.test(phoneNumber)) {
      setError('Phone number must contain only digits');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (!existingClient) {
        const existingClient = await getClientByPhone(phoneNumber);
        if (existingClient) {
          setError('A client with this phone number already exists');
          return;
        }
      }
      
      const client = await createClient({
        name,
        phone_number: phoneNumber,
        coffees_purchased: existingClient?.coffees_purchased || 0
      });
      
      if (onSave) {
        onSave(client);
      } else {
        navigate(`/clients/${client.id}`);
      }
    } catch (err) {
      console.error('Error saving client:', err);
      setError('Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-0 sm:max-w-md mx-auto">
      <form onSubmit={handleSubmit} className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'} rounded-xl shadow-lg border p-5 sm:p-8 transition-all duration-200`}>
        {error && (
          <div className={`${darkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 relative`}>
            <p className="text-sm sm:text-base font-medium">{error}</p>
          </div>
        )}
        
        <div className="mb-4 sm:mb-5">
          <label htmlFor="name" className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm sm:text-base font-medium mb-2`}>
            Full Name
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`pl-10 w-full p-3 border rounded-lg shadow-sm transition-colors duration-200 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              }`}
              placeholder="John Doe"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="phone" className={`block ${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm sm:text-base font-medium mb-2`}>
            Phone Number
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`pl-10 w-full p-3 border rounded-lg shadow-sm transition-colors duration-200 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              }`}
              placeholder="1234567890"
            />
          </div>
          <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 ml-1`}>
            Numbers only, no spaces or special characters
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`mb-3 sm:mb-0 px-4 py-2.5 border rounded-lg font-medium transition-all duration-200 ${
              darkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-medium shadow-md transition-all duration-200 
              ${loading 
                ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed` 
                : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Save Customer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 