import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  fullname: string;
  role: 'Siswa' | 'Admin' | 'Super Admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const setSession = (userData: User, tokenValue: string) => {
    setToken(tokenValue);
    setUser(userData);
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userData));

    if (userData.role === 'Siswa') {
      navigate('/student');
    } else {
      navigate('/admin');
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setSession(
          {
            id: data.user.id,
            username: data.user.username,
            fullname: data.user.fullname,
            role: data.user.role as User['role']
          },
          data.token
        );

        return true;
      }

      throw new Error(data.error || 'Login failed');
    } catch (error) {
      const isDemoAdmin = username === 'admin' && password === 'Min1ciamis!';
      const demoStudents = JSON.parse(localStorage.getItem('demoStudents') || '[]') as Array<{ nisn: string; nama: string }>;
      const demoPasswords = JSON.parse(localStorage.getItem('demoStudentPasswords') || '{}') as Record<string, string>;
      const demoStudent = demoStudents.find((student) => student.nisn === username);
      const demoPassword = demoPasswords[username] || 'Min1ciamis!';
      const isDemoStudent = Boolean(demoStudent) && password === demoPassword;

      if (isDemoAdmin) {
        setSession(
          { id: 1, username: 'admin', fullname: 'Super Admin', role: 'Super Admin' },
          'demo-token'
        );
        return true;
      }

      if (isDemoStudent && demoStudent) {
        setSession(
          { id: 2, username: demoStudent.nisn, fullname: demoStudent.nama, role: 'Siswa' },
          'demo-token'
        );
        return true;
      }

      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
