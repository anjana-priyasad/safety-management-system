console.log("Checking Env Vars:", import.meta.env);
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Key is missing!');
    console.log('VITE_SUPABASE_URL:', supabaseUrl);
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set (Hidden)' : 'Not Set');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
