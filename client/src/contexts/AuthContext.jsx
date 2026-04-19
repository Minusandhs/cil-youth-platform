import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cil_token');
    const savedUser = localStorage.getItem('cil_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  async function login(username, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error('Login failed');
      error.response = { status: response.status, data };
      throw error;
    }

    localStorage.setItem('cil_token', data.token);
    localStorage.setItem('cil_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('cil_token');
    localStorage.removeItem('cil_user');
    setUser(null);
  }

  const isSuperAdmin = user?.role === 'super_admin';
  const isLDCStaff = user?.role === 'ldc_staff';
  const isNationalAdmin = user?.role === 'national_admin';

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, logout, 
      isSuperAdmin, isLDCStaff, isNationalAdmin 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
