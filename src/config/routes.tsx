import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { ClientList } from '../components/ClientList';
import { ClientDetails } from '../pages/ClientDetails';
import { NewClient } from '../pages/NewClient';
import { Settings } from '../pages/Settings';
import { AboutUs } from '../pages/AboutUs';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Home } from '../pages/Home';
import AppLayout from '../components/AppLayout';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<AboutUs />} />

      {/* Protected routes */}
      <Route path="/customers" element={<ProtectedRoute><AppLayout><ClientList /></AppLayout></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clients/new" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><ClientDetails /></ProtectedRoute>} />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingSpinner />}>
              <Settings />
            </Suspense>
          </ProtectedRoute>
        } 
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
} 