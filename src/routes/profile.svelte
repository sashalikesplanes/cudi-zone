<script lang="ts">
	import Login from './_Login.svelte';
	import Friends from './_Friends.svelte';
  import { clientState } from '$lib/stores';

</script>

<div class="flex flex-col items-center gap-3 m-3">
	{#if !$clientState.userId}
    <Login/>
	{:else}
	  <Friends/>
		<btn on:click|preventDefault={() => {
		  $clientState.userId = '';
		  $clientState.userUsername = '';
		  $clientState.partnerId = '';
		  $clientState.partnerUsername = '';
		}} class="btn">Sign out</btn>
	{/if}
</div>
