import { ClientForm } from '../components/ClientForm';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import AppLayout from '../components/AppLayout';

export function NewClient() {
  const { darkMode } = useTheme();
  
  return (
    <AppLayout>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="px-4 py-4 sm:py-8">
          <div className="mb-4 sm:mb-6">
            <Link 
              to="/customers" 
              className={`inline-flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-800'} transition-colors mb-2 sm:mb-4`}
            >
              <svg className="mr-2 w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to customers
            </Link>
            <h1 className={`text-2xl sm:text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add New Customer
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base mt-1 sm:mt-2`}>
              Create a customer record to start tracking their loyalty program.
            </p>
          </div>
          <ClientForm />
        </div>
      </div>
    </AppLayout>
  );
} 