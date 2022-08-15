<script lang="ts">
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
		} else if (view === 'signin') {
			const { error: signInError } = await supabaseClient.auth.signIn({ email, password });
			error = signInError?.message || '';
		} else {
		  console.error('neither method attempted')
		}
		loading = false;
	}
</script>

{#if error}
	<p>{error}</p>
{/if}
<form on:submit|preventDefault={submit} class="w-full max-w-md">
	<dl>
		<div class="flex items-center mb-3">
			<dt class="w-1/3">
				<label class="block text-right pr-3" for="username">Username:</label>
			</dt>
			<dd class="w-2/3">
				<input
					type="text"
          required
          title="Please only include up to 22 alphanumeric characters"
					class="input input-bordered bg-base-200 w-full"
					pattern={`[0-9A-Za-z]{1,22}`}
					bind:value={username}
					name="username"
					id="username"
					placeholder="IamCool"
				/>
			</dd>
		</div>

		<div class="flex items-center mb-3">
			<dt class="w-1/3">
				<label class="block text-right pr-3" for="password">Password:</label>
			</dt>
			<dd class="w-2/3">
				<input
				  required
					class="input input-bordered bg-base-200 w-full"
					type="password"
					bind:value={password}
					name="password"
					placeholder="pAsSWoRd"
					id="password"
				/>
			</dd>
			<div />
		</div>
		<div class="flex justify-center mb-3">
			<button type="submit" class="btn btn-wide {loading ? 'loading' : ''}"
				>Sign {view === 'signin' ? 'In' : 'Up'}</button
			>
		</div>
	</dl>
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
