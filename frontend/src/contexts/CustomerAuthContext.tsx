import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from '@/integrations/firebase/client';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  loyalty_points: number;
  wallet_balance: number;
  language: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CustomerAuthContextType {
  firebaseUser: FirebaseUser | null;
  customer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Customer>) => Promise<{ error: Error | null }>;
  refreshCustomer: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync customer data to Supabase using email as the key
  const syncCustomerToSupabase = async (user: FirebaseUser, name?: string): Promise<Customer | null> => {
    try {
      if (!user.email) {
        console.error('User has no email');
        return null;
      }

      // Check if customer exists by email
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .eq('email', user.email)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching customer:', fetchError);
        return null;
      }

      if (existingCustomer) {
        // Update last activity
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existingCustomer.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating customer:', updateError);
          return existingCustomer as Customer;
        }
        return updatedCustomer as Customer;
      }

      // Create new customer in Supabase
      const newCustomer = {
        tenant_id: TENANT_ID,
        email: user.email,
        name: name || user.displayName || '',
        phone: null,
        loyalty_points: 0,
        wallet_balance: 0,
        language: 'en',
        status: 'active',
      };

      const { data: createdCustomer, error: createError } = await supabase
        .from('customers')
        .insert(newCustomer)
        .select()
        .single();

      if (createError) {
        console.error('Error creating customer:', createError);
        // Return a local customer object if insert fails (RLS issue)
        return {
          id: '',
          email: user.email,
          name: name || user.displayName || '',
          phone: null,
          loyalty_points: 0,
          wallet_balance: 0,
          language: 'en',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Customer;
      }

      console.log('Customer created successfully:', createdCustomer);
      return createdCustomer as Customer;
    } catch (error) {
      console.error('Error syncing customer:', error);
      return null;
    }
  };

  // Refresh customer data from database
  const refreshCustomer = async () => {
    if (!firebaseUser?.email) return;
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .eq('email', firebaseUser.email)
        .single();
      
      if (data && !error) {
        setCustomer(data as Customer);
      }
    } catch (err) {
      console.error('Error refreshing customer:', err);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        const customerData = await syncCustomerToSupabase(user);
        setCustomer(customerData);
      } else {
        setCustomer(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const customerData = await syncCustomerToSupabase(userCredential.user);
      setCustomer(customerData);
      toast.success('Welcome back!');
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      let message = 'Failed to sign in';
      if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      }
      toast.error(message);
      return { error: new Error(message) };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const customerData = await syncCustomerToSupabase(userCredential.user, name);
      setCustomer(customerData);
      toast.success('Account created successfully!');
      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      let message = 'Failed to create account';
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      toast.error(message);
      return { error: new Error(message) };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCustomer(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const updateProfile = async (updates: Partial<Customer>) => {
    if (!customer || !customer.id) {
      return { error: new Error('Not authenticated') };
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (error) throw error;

      setCustomer(data as Customer);
      toast.success('Profile updated successfully');
      return { error: null };
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
      return { error };
    }
  };

  const isAuthenticated = !!firebaseUser;

  return (
    <CustomerAuthContext.Provider
      value={{
        firebaseUser,
        customer,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
