import { useTheme } from '../hooks/useTheme';
import { usePayment } from '../hooks/usePayment';
import { PaymentModal } from './PaymentModal';

export function CreditBalanceWarning() {
  const { darkMode } = useTheme();
  const { openPaymentModal } = usePayment();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="container mx-auto px-4 py-16">
        <div className={`max-w-md mx-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-lg p-6 text-center`}>
          <div className={`${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'} rounded-full p-3 w-16 h-16 mx-auto mb-4`}>
            <svg 
              className={`w-10 h-10 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Insufficient Credit Balance
          </h2>
          
          <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Your credit balance is currently at 0. Please add credits to continue using the loyalty program features.
          </p>
          
          <button
            onClick={openPaymentModal}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-2.5 px-4 rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Add Credits
          </button>
        </div>
      </div>
      <PaymentModal />
    </div>
  );
} 