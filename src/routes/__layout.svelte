<script lang="ts">
	import '../app.css';
	import { session } from '$app/stores';
	import { supabaseClient } from '$lib/db';
	import { SupaAuthHelper } from '@supabase/auth-helpers-svelte';

</script>

<SupaAuthHelper {supabaseClient} {session}>
  <div class="navbar bg-neutral text-neutral-content">
    <div class="flex-1">
      <a href="/" class="btn btn-ghost normal-case text-xl">CudiZone</a>
    </div>
    <div class="flex-none">
      <ul class="menu menu-horizontal p-0">
        <li><a href="/movies">Movies</a></li>
        <li><a href="/profile">Profile</a></li>
      </ul>
    </div>
  </div>

  <slot />

</SupaAuthHelper>

