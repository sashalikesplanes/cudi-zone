<script lang="ts">
	import '../app.postcss';
	import { browser } from '$app/env';
	import { user } from '$lib/stores';

	// populate the user object with all necessary data
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
    {#if $user && $user.partnerId}
      <p>Partner: {$user.partnerUsername}</p>
    {:else}
      <p>No active partner</p>
    {/if}
  </div>
  <div class="flex-none">
    <ul class="menu menu-horizontal p-0">
      <li><a href="/chatroom">ChatRoom</a></li>
      <li><a href="/">{($user && $user.name) || 'Profile'}</a></li>
    </ul>
  </div>
</div>

<slot />
