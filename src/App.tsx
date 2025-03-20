import { AuthProvider } from './contexts/AuthContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { ThemeProvider } from './contexts/ThemeProvider';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { Navbar } from './components/Navbar';
import { Toaster } from 'react-hot-toast';
import { PaymentModal } from './components/PaymentModal';
import { AppRoutes } from './config/routes';
import { toastConfig } from './config/toastConfig';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <DarkModeProvider>
        <AuthProvider>
          <PaymentProvider>
            <Toaster {...toastConfig} />
            <PaymentModal />
            <Navbar />
            <AppRoutes />
          </PaymentProvider>
        </AuthProvider>
      </DarkModeProvider>
    </ThemeProvider>
  );
}

export default App;
