import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children, requiredRole }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // 'any' means any authenticated user can access
  if (requiredRole && requiredRole !== 'any' && user.role !== requiredRole) {
    const redirect = user.role === 'super_admin' ? '/admin' : '/ldc';
    return <Navigate to={redirect} replace />;
  }
  return children;
}