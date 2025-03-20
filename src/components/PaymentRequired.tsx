import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePayment } from '../hooks/usePayment';

type PaymentRequiredProps = {
  children: ReactNode;
};

export function PaymentRequired({ children }: PaymentRequiredProps) {
  const { hasPaid, isLoadingPayment } = usePayment();
  
  if (isLoadingPayment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!hasPaid) {
    return <Navigate to="/payment" replace />;
  }
  
  return <>{children}</>;
} 