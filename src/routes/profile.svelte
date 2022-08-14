<script lang="ts">
	import { session } from '$app/stores';
	import Login from './_Login.svelte';
	import Friends from './_Friends.svelte';

</script>

<div class="flex flex-col items-center gap-3 m-3">
	{#if !$session.user}
    <Login/>
	{:else}
	  <Friends/>
		<a href="/api/auth/logout" class="btn">Sign out</a>
	{/if}
</div>
