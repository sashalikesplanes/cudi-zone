<script lang="ts">
	import '../app.css';
	import { browser } from '$app/env';
	import { clientState } from '$lib/stores';

	let currentTheme = 'valentine';
	function changeTheme() {
		if (!browser) return;
		const html = document.childNodes[1] as HTMLElement;
		if (html.dataset.theme === 'dark') {
			html.dataset.theme = 'valentine';
			currentTheme = 'valentine';
		} else {
			html.dataset.theme = 'dark';
			currentTheme = 'dark';
		}
	}
</script>

<div class="navbar bg-neutral text-neutral-content">
  <div class="flex-1">
    <a href="/" class="btn btn-ghost normal-case text-xl">CudiZone</a>
    <button on:click={changeTheme} class="btn btn-ghost"
      >{currentTheme === 'dark' ? 'Pink' : 'Dark'}</button
    >
    {#if $clientState.partnerId}
      <p>Partner: {$clientState.partnerUsername}</p>
    {:else}
      <p>No active partner</p>
    {/if}
  </div>
  <div class="flex-none">
    <ul class="menu menu-horizontal p-0">
      <li><a href="/movies">Movies</a></li>
      <li><a href="/profile">{$clientState.userUsername || 'Profile'}</a></li>
    </ul>
  </div>
</div>

<slot />
