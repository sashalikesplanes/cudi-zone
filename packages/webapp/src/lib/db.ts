import { createClient, SupabaseClient } from "@supabase/supabase-js";
const VITE_SUPABASE_URL='https://mnlchopybdirizdggswp.supabase.co'
const VITE_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ubGNob3B5YmRpcml6ZGdnc3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjAzOTczMzUsImV4cCI6MTk3NTk3MzMzNX0.jKxaV2n2gPWK-CwHnJZxpW3qx-vTceo0MHQGZFItm9M'

const client = createClient(
  // @ts-ignore - I made them
  VITE_SUPABASE_URL,
  // @ts-ignore
  VITE_SUPABASE_ANON_KEY
);

if (!client || client === undefined) {
  throw new Error('could not connect to supabase');
}

export const supabaseClient = client as SupabaseClient;

