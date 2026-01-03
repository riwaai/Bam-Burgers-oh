import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Hardcoded admin credentials
const ADMIN_USERNAME = 'BamBurgers';
const ADMIN_PASSWORD = 'EatBam@123%65';

interface AdminUser {
  username: string;
  role: 'admin';
  loginTime: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'bam_admin_session';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    try {
      const storedSession = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (storedSession) {
        const session = JSON.parse(storedSession);
        // Check if session is still valid (24 hours)
        const loginTime = new Date(session.loginTime).getTime();
        const now = new Date().getTime();
        const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursSinceLogin < 24) {
          setAdmin(session);
        } else {
          // Session expired
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('Error loading admin session:', err);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string): Promise<{ error: string | null }> => {
    // Validate credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const adminUser: AdminUser = {
        username: ADMIN_USERNAME,
        role: 'admin',
        loginTime: new Date().toISOString(),
      };
      
      // Store in localStorage
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminUser));
      setAdmin(adminUser);
      
      return { error: null };
    } else {
      return { error: 'Invalid username or password' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!admin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
