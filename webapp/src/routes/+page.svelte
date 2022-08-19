<script lang="ts">
import { supabaseClient } from '$lib/db';

	import { user } from '$lib/stores';
	import Auth from './Auth.svelte';
	import Profile from './Profile.svelte';

	function logout() {
	  supabaseClient?.auth.signOut();
	}

</script>

<div class="flex flex-col items-center gap-3 m-3">
	{#if !$user}
    <Auth/>
	{:else}
	  <Profile/>
		<a on:click|preventDefault={logout} class="btn">Sign out</a>
	{/if}
</div>

