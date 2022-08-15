import { createSupabaseClient } from '@supabase/auth-helpers-sveltekit';

const { supabaseClient: client } = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

if (!client) throw new Error('could not initialize supabase client');

export const supabaseClient = client;
