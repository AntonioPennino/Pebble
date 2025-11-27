import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl, isCloudSyncConfigured } from './config.js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isCloudSyncConfigured()) {
    return null;
  }
  if (!client) {
    client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false },
      global: {
        headers: {
          'x-pebble-client': 'pebble-app'
        }
      }
    });
  }
  return client;
}
