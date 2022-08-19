<script lang="ts">
  // TODO rework AUTH to be server side
	import { supabaseClient } from '$lib/db';
	import { page } from '$app/stores';

	let username = '',
		password = '',
		loading = false;
	$: view = $page.url.searchParams.get('view') || 'signin';
	let error: string;

	async function submit() {
		loading = true;
		const email = username + '@fake.email';
		if (view === 'signup') {
			const { error: signUpError } = await supabaseClient.auth.signUp({ email, password });
			error = signUpError?.message || '';
			// $session.user = { id: user.id }
		} else if (view === 'signin') {
			const { error: signInError } = await supabaseClient.auth.signIn({ email, password });
			error = signInError?.message || '';
		}
		loading = false;
	}
</script>

{#if error}
	<p>{error}</p>
{/if}
<form on:submit|preventDefault={submit} class="form-control gap-3 items-center w-full max-w-sm">
	<label class="input-group " for="username"
		><span class="w-36">Username</span>
		<input
			type="text"
			required
			title="Please only include up to 22 alphanumeric characters"
			class="input w-full input-bordered bg-base-200"
			pattern={`[0-9A-Za-z]{1,22}`}
			bind:value={username}
			name="username"
			id="username"
			placeholder="IamCool"
		/>
	</label>

	<label class="input-group" for="password">
		<span class="w-36">Password</span>
		<input
			required
			class="input w-full input-bordered bg-base-200"
			type="password"
			bind:value={password}
			name="password"
			placeholder="pAsSWoRd"
			id="password"
		/>
	</label>
	<button type="submit" class="btn btn-wide {loading ? 'loading' : ''}"
		>Sign {view === 'signin' ? 'In' : 'Up'}</button
	>
</form>
<div class="flex justify-center">
	{#if view === 'signin'}
		<a class="link text-center w-max mb-3" href="/profile?view=signup"
			>Don't have an account? Sign up!</a
		>
	{:else}
		<a class="link text-center w-max" href="/profile?view=signin"
			>Already have an account? Sign in!</a
		>
	{/if}
</div>
