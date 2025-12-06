/**
 * Normalizes Supabase URL to ensure HTTPS and proper formatting
 * Fixes issues with HTTP URLs and trailing slashes
 */
export function getSupabaseUrl(): string {
  let url = import.meta.env.VITE_SUPABASE_URL || '';
  
  if (!url) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable');
  }

  // Remove trailing slashes
  url = url.trim().replace(/\/+$/, '');

  // Force HTTPS if it's HTTP
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
    console.warn('[Supabase URL] Converted HTTP to HTTPS:', url);
  }

  // Ensure it starts with https://
  if (!url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url;
}

/**
 * Constructs a Supabase Edge Function URL
 * Ensures proper URL formatting without double slashes
 */
export function getSupabaseFunctionUrl(functionPath: string): string {
  const baseUrl = getSupabaseUrl();
  
  // Remove leading slash from functionPath if present
  const cleanPath = functionPath.startsWith('/') ? functionPath.slice(1) : functionPath;
  
  // Ensure single slash between base URL and path
  return `${baseUrl}/${cleanPath}`;
}

