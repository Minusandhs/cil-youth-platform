import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import LDCDashboard from './pages/LDCDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'DM Sans, sans-serif',
              fontSize  : '13px',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/admin/*" element={
            <PrivateRoute requiredRole="super_admin">
              <AdminDashboard />
            </PrivateRoute>
          }/>
          <Route path="/ldc/*" element={
            <PrivateRoute requiredRole="ldc_staff">
              <LDCDashboard />
            </PrivateRoute>
          }/>
          <Route path="*" element={
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="text-6xl mb-4">404</div>
                <div className="text-xl text-gray-500">Page not found</div>
              </div>
            </div>
          }/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}