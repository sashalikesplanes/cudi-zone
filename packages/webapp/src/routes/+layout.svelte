<script lang="ts">
	import '../app.postcss';
	import { browser } from '$app/env';
	import { user } from '$lib/stores';

	// populate the user object with all necessary data
	let html: HTMLElement;
	if (browser) {
		html = document.childNodes[1] as HTMLElement;
		if ($user) html.dataset.theme = $user.theme;
	}
</script>

<div class="navbar bg-neutral text-neutral-content">
	<div class="flex-1">
		<a href="/" class="btn btn-ghost normal-case text-xl">CudiZone</a>
		{#if $user}
			<button
				on:click={() => {
					user.changeTheme();
					// @ts-ignore, just checked above if user exists
					html.dataset.theme = $user.theme;
				}}
				class="btn btn-ghost">{$user.theme === 'dark' ? 'Pink' : 'Dark'}</button
			>
		{/if}
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
