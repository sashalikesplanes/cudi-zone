import { handleAuth, supabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import type { GetSession, Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { supabaseClient } from '$lib/db';

export const handle: Handle = sequence(...handleAuth({
  logout: { returnTo: '/profile' },
}));

export const getSession: GetSession = async (event) => {
  const { user, accessToken, error } = event.locals;
  return { user, accessToken, error };
}
