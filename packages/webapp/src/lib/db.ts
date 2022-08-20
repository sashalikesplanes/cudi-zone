import { createSupabaseClient, type SupabaseClient } from '@supabase/auth-helpers-sveltekit';

const { supabaseClient: client } = createSupabaseClient(
  // @ts-ignore - I made them
  import.meta.env.VITE_SUPABASE_URL,
  // @ts-ignore
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

if (!client || client === undefined) {
  throw new Error('could not connect to supabase');
}

export const supabaseClient = client as SupabaseClient;
