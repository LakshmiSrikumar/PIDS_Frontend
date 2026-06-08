import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthState {
  token: string | null;
  role: string | null;
  setAuth: (token: string, role: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [role, setRole] = useState<string | null>(
    localStorage.getItem('role')?.toLowerCase() || null
  );

  const setAuth = (t: string, r: string) => {
    const normalizedRole = r.toLowerCase();
    localStorage.setItem('token', t);
    localStorage.setItem('role', normalizedRole);
    setToken(t);
    setRole(normalizedRole);
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);