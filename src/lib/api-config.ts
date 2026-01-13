/**
 * Centralized API configuration
 * All API calls should use these constants to ensure consistent URL handling
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:9999';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Build a full API URL
 * @param path - API path (e.g., '/api/users', '/api/organizations')
 */
export function apiUrl(path: string): string {
    return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
}

/**
 * Build a Supabase URL
 * @param path - Supabase path (e.g., '/auth/v1/token')
 */
export function supabaseUrl(path: string): string {
    return `${SUPABASE_URL}${path.startsWith('/') ? path : '/' + path}`;
}
