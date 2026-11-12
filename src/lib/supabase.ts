import { createClient } from '@supabase/supabase-js';

/**
 * Normalizes a raw Supabase URL string:
 * - Strips accidental quotes and trailing whitespace
 * - Resolves escaped slashes (e.g. https:\/\/...)
 * - Normalizes Supabase dashboard URLs: https://supabase.com/dashboard/project/<ref> -> https://<ref>.supabase.co
 * - Normalizes bare project reference tokens (e.g. 'abcdefghijklmnopqrst') -> https://<ref>.supabase.co
 * - Normalizes bare domains without protocol (e.g. 'xyz.supabase.co') -> https://xyz.supabase.co
 */
export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';

  // 1. Strip surrounding quotes and whitespace
  let trimmed = rawUrl.trim().replace(/^['"]+|['"]+$/g, '');

  // 2. Normalize escaped slashes and Windows backslashes
  trimmed = trimmed.replace(/\\\//g, '/').replace(/\\/g, '/').replace(/\/+$/, '');

  // 3. Fix accidental duplicate protocol slashes
  trimmed = trimmed.replace(/(https?:\/\/)\/+/g, '$1');

  // 4. Match Supabase dashboard URL pattern: https://supabase.com/dashboard/project/<project-ref>
  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // 5. If it is already a full http(s) URL
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  // 6. If it contains a domain with dot (e.g. xyz.supabase.co or a custom proxy domain)
  if (trimmed.includes('.')) {
    return `https://${trimmed}`;
  }

  // 7. If it's a bare project reference token without domain
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }

  return `https://${trimmed}`;
}

/**
 * Secret Key Guard:
 * Strictly detects and rejects secret / service-role keys.
 * Secret keys must NEVER be exposed or used in frontend browser code.
 */
export function isSecretKey(rawKey?: string): boolean {
  if (!rawKey) return false;
  const trimmed = rawKey.trim().replace(/^['"]+|['"]+$/g, '');

  // Check known secret key prefixes
  if (
    trimmed.startsWith('sb_secret_') ||
    trimmed.startsWith('sb_sec_') ||
    trimmed.startsWith('sbp_secret_') ||
    trimmed.startsWith('service_role')
  ) {
    return true;
  }

  // Check JWT role claim if formatted as 3-part token
  try {
    const parts = trimmed.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(payloadBase64);
      const parsed = JSON.parse(decoded);
      if (parsed.role && parsed.role.toLowerCase().includes('service_role')) {
        return true;
      }
    }
  } catch {
    if (trimmed.toLowerCase().includes('service_role')) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a given string is a placeholder or template value
 */
export function isPlaceholder(val?: string): boolean {
  if (!val) return true;
  const lower = val.toLowerCase().trim().replace(/^['"]+|['"]+$/g, '');
  return (
    lower === '' ||
    lower.includes('placeholder') ||
    lower.includes('your-') ||
    lower.includes('your_') ||
    lower.includes('<your') ||
    lower === 'dummy-key' ||
    lower === 'dummy-anon-key'
  );
}

// Read raw environment variables
const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL;
const rawEnvAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Normalized URL
export const supabaseUrl = normalizeSupabaseUrl(rawEnvUrl);

// Secret Key Rejection Check
const secretKeyDetected = isSecretKey(rawEnvAnonKey);
if (secretKeyDetected) {
  console.error(
    '[Supabase Security Warning]: You have provided a secret / service-role key as VITE_SUPABASE_ANON_KEY. ' +
    'Secret keys must NEVER be exposed in frontend client code. ' +
    'Please copy the public "anon" / "publishable" key from Supabase Dashboard > Project Settings > API.'
  );
}

// Publishable / Anon Key (sanitized of quotes; blanked if secret key)
export const supabaseAnonKey = secretKeyDetected
  ? ''
  : (rawEnvAnonKey?.trim().replace(/^['"]+|['"]+$/g, '') || '');

// Valid configuration check
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !isPlaceholder(supabaseUrl) &&
  !isPlaceholder(supabaseAnonKey) &&
  !secretKeyDetected &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://'))
);

if (!isSupabaseConfigured) {
  console.info(
    '[Shiva Shakthi Collections]: Supabase credentials are not configured or invalid in .env. ' +
    'The website is running in safe local catalog preview mode with full browsing, cart, wishlist, and WhatsApp ordering.'
  );
}

// Export the singleton Supabase client
// When not configured, initialize with safe dummy values so client calls do not crash during app boot
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'dummy-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'ssc-auth-token',
    },
  }
);
