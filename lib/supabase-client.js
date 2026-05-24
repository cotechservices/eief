// lib/supabase-client.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Logs pour déboguer
console.log('🔍 Supabase URL:', supabaseUrl ? '✅ présente' : '❌ manquante');
console.log('🔍 Supabase Key:', supabaseKey ? '✅ présente' : '❌ manquante');

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing');
}

if (!supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});