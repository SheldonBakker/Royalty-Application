import { Navigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { MFAVerify } from './MFAVerify';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading, getAuthenticatorAssuranceLevel } = useAuth();
  const [mfaCheckComplete, setMfaCheckComplete] = useState(false);
  const [showMFAVerify, setShowMFAVerify] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (user && !authLoading) {
      const checkMFAStatus = async () => {
        try {
          const { data, error } = await getAuthenticatorAssuranceLevel();
          
          if (error) {
            console.error('Error checking MFA status:', error);
            if (isMounted.current) {
              setMfaCheckComplete(true);
            }
            return;
          }
          
          if (isMounted.current && data?.nextLevel === 'aal2' && data?.currentLevel === 'aal1') {
            setShowMFAVerify(true);
          }
        } finally {
          if (isMounted.current) {
            setMfaCheckComplete(true);
          }
        }
      };
      
      checkMFAStatus();
    } else {
      setMfaCheckComplete(true);
    }

    return () => {
      isMounted.current = false;
    };
  }, [user, authLoading, getAuthenticatorAssuranceLevel]);

  if (authLoading || !mfaCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (showMFAVerify) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <MFAVerify 
          onSuccess={() => setShowMFAVerify(false)} 
          onCancel={() => setShowMFAVerify(false)} 
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
} 