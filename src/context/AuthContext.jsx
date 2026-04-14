import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, signupUser, fetchRemoteData } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('misu_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // In a broader app, we'd verify the token on mount.
      // For now, assume validity or handle 401 on data fetch.
      setUser({ token });
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('misu_token', data.token);
    return data;
  };

  const signup = async (email, password) => {
    const data = await signupUser(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('misu_token', data.token);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('misu_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
