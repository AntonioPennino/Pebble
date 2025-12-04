import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl, isCloudSyncConfigured } from '../config.js';
let client = null;
export function getSupabaseClient() {
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
