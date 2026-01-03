// Supabase client configuration for Bam Burgers
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(
  SUPABASE_URL || '',
  SUPABASE_ANON_KEY || '',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Tenant and Branch IDs - Use actual UUIDs from Supabase
export const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'd82147fa-f5e3-474c-bb39-6936ad3b519a';
export const BRANCH_ID = import.meta.env.VITE_BRANCH_ID || '3f9570b2-24d2-4f2d-81d7-25c6b35da76b';

// Restaurant Info
export const RESTAURANT_NAME = 'Bam Burgers';
export const RESTAURANT_ADDRESS = 'Kitchen Park Salwa - 834C+HH Rumaithiya, Kuwait';
export const RESTAURANT_PHONE = '+965 9474 5424';
export const LOGO_URL = 'https://customer-assets.emergentagent.com/job_bamorder/artifacts/khnaf5kz_Logo.png';
