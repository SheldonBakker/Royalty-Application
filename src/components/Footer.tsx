import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

type FooterProps = {
  variant?: 'default' | 'simple';
};

export function Footer({ variant = 'default' }: FooterProps) {
  const { darkMode } = useTheme();
  const currentYear = new Date().getFullYear();
  
  // Simple variant (centered, like in AboutUs)
  if (variant === 'simple') {
    return (
      <footer className={`py-10 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800 text-gray-400 border-t border-gray-700' : 'bg-gray-50 text-gray-600 border-t border-gray-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Have questions? Contact us at <a href="mailto:support@remlic.co.za" className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors duration-200`}>support@remlic.co.za</a>
            </p>
            <p className="mt-4 text-sm">© {currentYear} Loyalty Bean. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  }
  
  // Default variant (with logo and links, like in Home)
  return (
    <footer className={`py-16 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-900 text-gray-400 border-t border-gray-800' : 'bg-white text-gray-600 border-t border-gray-100'}`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-8 md:mb-0">
          <div className={`flex items-center text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <img src="/favicon.svg" className="h-8 w-8 mr-3" alt="Loyalty Bean logo" />
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-indigo-600'}`}>Loyalty Bean</span>
          </div>
          <p className="text-sm">© {currentYear} Loyalty Bean. All rights reserved.</p>
        </div>
        <div className="flex space-x-10">
          <Link to="/about" className="text-lg hover:underline transition-colors duration-200">About</Link>
          <Link to="/register" className="text-lg hover:underline transition-colors duration-200">Sign Up</Link>
          <Link to="/login" className="text-lg hover:underline transition-colors duration-200">Login</Link>
          <a href="mailto:support@remlic.co.za" className="text-lg hover:underline transition-colors duration-200">Contact</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 