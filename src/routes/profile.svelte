<script lang="ts">
	import { supabaseClient } from '$lib/db';
	import { session } from '$app/stores';
	// import { error, isLoading } from '@supabase/auth-helpers-svelte';

	let email = '',
		password = '',
		loading = false;
	let view: 'signin' | 'signup' = 'signup';
	let error: string;
	async function submit() {
		loading = true;
		if (view === 'signup') {
			const { error: signUpError } = await supabaseClient.auth.signUp({ email, password });
			error = signUpError?.message || '';
		} else if (view === 'signin') {
			const { error: signInError } = await supabaseClient.auth.signIn({ email, password });
			error = signInError?.message || '';
		}
		loading = false;
	}
</script>

<div class="flex flex-col items-center gap-3 m-3">
	{#if !$session.user}
		<div class="btn-group">
			<button class="btn {view === 'signin' ? 'btn-active' : ''}" on:click={() => (view = 'signin')}
				>Sign In</button
			>
			<button class="btn {view === 'signup' ? 'btn-active' : ''}" on:click={() => (view = 'signup')}
				>Sign Up</button
			>
		</div>
		{#if error}
			<p>{error}</p>
		{/if}
		<!-- <h1>{$isLoading ? 'Loading...' : 'Loaded!'}</h1> -->
		<p>{loading}</p>
		<form on:submit|preventDefault={submit} class="flex flex-col items-center gap-3">
			<label for="email">Email:</label>
			<input type="email" bind:value={email} name="email" id="email" placeholder="email@add.res" />
			<label for="password">Password:</label>
			<input type="password" bind:value={password} name="password" placeholder="pAsSWoRd" id="password" />
			<button type="submit" class="btn {loading ? 'loading' : ''}" >Sign {view === 'signin' ? 'In' : 'Up'}</button>
		</form>
	{:else}
		<a href="/api/auth/logout" class="btn">Sign out</a>
	{/if}
	<pre>{JSON.stringify($session.user?.id || 'none')}</pre>
</div>
