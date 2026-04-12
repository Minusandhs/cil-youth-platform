import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import LDCDashboard from './pages/LDCDashboard';
import ParticipantProfile from './pages/ParticipantProfile';

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
          <Route path="/participant/:id" element={
            <PrivateRoute requiredRole="ldc_staff">
              <ParticipantProfile />
            </PrivateRoute>
          }/>
          <Route path="*" element={
            <div style={{
              display:'flex', alignItems:'center',
              justifyContent:'center', height:'100vh'
            }}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:'64px', marginBottom:'16px'}}>404</div>
                <div style={{color:'#6b5e4a', fontSize:'16px'}}>Page not found</div>
              </div>
            </div>
          }/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}