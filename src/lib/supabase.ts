import { createClient } from '@supabase/supabase-js';

// Normalize Supabase URL to ensure HTTPS and remove trailing slashes
function normalizeSupabaseUrl(url: string): string {
  if (!url) return url;
  
  // Remove trailing slashes
  let normalized = url.trim().replace(/\/+$/, '');
  
  // Force HTTPS if it's HTTP (fixes mixed content errors)
  if (normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'https://');
    console.warn('[Supabase] Converted HTTP to HTTPS:', normalized);
  }
  
  // Ensure it starts with https://
  if (!normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }
  
  return normalized;
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
