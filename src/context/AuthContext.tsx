import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthState {
  token: string | null;
  role: string | null;
  userName: string | null;
  setAuth: (token: string, role: string, userName?: string) => void;
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
  const [userName, setUserName] = useState<string | null>(
    localStorage.getItem('username')
  );

  const setAuth = (t: string, r: string, uName?: string) => {
    const normalizedRole = r.toLowerCase();
    localStorage.setItem('token', t);
    localStorage.setItem('role', normalizedRole);
    setToken(t);
    setRole(normalizedRole);
    if (uName) {
      localStorage.setItem('username', uName);
      setUserName(uName);
      } else {
            localStorage.removeItem('username');
            setUserName(null);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setToken(null);
    setRole(null);
    setUserName(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, userName, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);