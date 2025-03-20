import { Payment } from '../pages/Payment';
import { usePayment } from '../hooks/usePayment';

export function PaymentModal() {
  const { showPaymentModal, closePaymentModal } = usePayment();
  
  if (!showPaymentModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4">
        <Payment onClose={closePaymentModal} />
      </div>
    </div>
  );
} 