import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Auto-correct if the user accidentally pasted just the project ID instead of the full URL
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  if (supabaseUrl.includes('.')) {
    supabaseUrl = `https://${supabaseUrl}`;
  } else {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
  }
}

let client = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (err) {
  console.error("Supabase Initialization Error:", err);
  // Fails gracefully to trigger the config UI instead of a black screen
}

export const supabase = client;
