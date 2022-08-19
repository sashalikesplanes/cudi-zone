import { createSupabaseClient } from '@supabase/auth-helpers-sveltekit';

const { supabaseClient } = createSupabaseClient(
  // @ts-ignore - I made them
  import.meta.env.VITE_SUPABASE_URL,
  // @ts-ignore
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

if (!supabaseClient || supabaseClient === undefined) {
  throw new Error('could not connect to supabase');
}

export { supabaseClient };
