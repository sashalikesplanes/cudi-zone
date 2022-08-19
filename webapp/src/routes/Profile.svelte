<script lang="ts">
	import { supabaseClient } from '$lib/db';
	import { user } from '$lib/stores';
	import { goto } from '$app/navigation';

	type User = {
	  id: string;
	  email: string;
	}

	let activeFriendsPromise = getActiveFriends();
	let friendRequestsPromise = getFriendRequests();

	let newFriend = '';
	let loadingNewFriend = false;
	let errors = '';

	// ids of friends whose requests are being replied to
	let loadingDenies: string[] = [];
	let loadingAccepts: string[] = [];

	async function getActiveFriends() {
	  if (!$user) throw new Error('no user');

		const { data } = await supabaseClient
			.from('active_friendships')
			.select('*')
			.eq('user_id', $user.id);

		if (!data) return [];

		return data.map((friendship) => ({
			username: friendship.friend_email.split('@')[0],
			id: friendship.friend_id
		}));
	}

	async function getFriendRequests() {
	  if (!$user) throw new Error('no user');

		const { data } = await supabaseClient
			.from('pending_friendships')
			.select('*')
			.eq('friend_id', $user.id);

		if (!data) return [];

		return data.map((request) => ({
			username: request.user_email.split('@')[0],
			id: request.user_id
		}));
	}

	async function acceptFriendRequest(friendId: string) {
	  if (!$user) throw new Error('no user');

		loadingAccepts = [...loadingAccepts, friendId];
		await supabaseClient.from('friendships').insert([
			{
				user_id: $user.id,
				friend_id: friendId
			}
		]);
		const idx = loadingAccepts.indexOf(friendId);
		loadingAccepts.splice(idx, 1);
		loadingAccepts = loadingAccepts;
		activeFriendsPromise = getActiveFriends();
		friendRequestsPromise = getFriendRequests();
	}

	async function denyFriendRequest(friendId: string) {
		loadingDenies = [...loadingDenies, friendId];
		await supabaseClient.from('friendships').delete().eq('user_id', friendId);
		const idx = loadingDenies.indexOf(friendId);
		loadingDenies.splice(idx, 1);
		loadingDenies = loadingDenies;
		friendRequestsPromise = getFriendRequests();
	}

	async function addNewFriend() {
	  if (!$user) throw new Error('no user');
		// TODO move to server side and add error handling
		loadingNewFriend = true;
		const { data: userData } = await supabaseClient
			.from<User>('users')
			.select('*')
			.eq('email', newFriend + '@fake.email');
		if (!userData || userData.length === 0) {
			errors = 'User does not exist';
			loadingNewFriend = false;
			return;
		}
		const newFriendId = userData[0].id;
		const { error } = await supabaseClient.from('friendships').insert([
			{
				user_id: $user.id,
				friend_id: newFriendId
			}
		]);

		if (error) {
			errors = error.message;
		} else {
			newFriend = '';
		}
		loadingNewFriend = false;
	}
	async function joinRoom(friendId: string, friendUsername: string) {
	  if (!$user) throw new Error('no user');

		$user.partnerId = friendId;
		$user.partnerUsername = friendUsername;
		goto('movies');
	}
</script>

<main class="w-96">
	{#await activeFriendsPromise}
		<p class="text-center">Loading friends...</p>
	{:then activeFriends}
		<ul>
			{#each activeFriends as friend (friend.id)}
				<article class="alert shadow-lg mb-3">
					<span class="text-xl font-bold">{friend.username}</span>
					<div class="flex-none">
						<button
							on:click={() => joinRoom(friend.id, friend.username)}
							class="btn btn-sm btn-primary">Join Room</button
						>
					</div>
				</article>
			{:else}
				<p>You don't have any friends right now... Add one!</p>
			{/each}
		</ul>
	{:catch error}
		<p>{error.message}</p>
	{/await}

	<div class="divider" />

	{#await friendRequestsPromise}
		<p class="text-center">Loading friend requests...</p>
	{:then friendRequests}
		<ul>
			{#each friendRequests as request (request.id)}
				<article class="alert shadow-lg mb-3">
					<span class="text-2xl font-bold">{request.username}</span>
					<div class="flex-none">
						<button
							on:click={() => denyFriendRequest(request.id)}
							disabled={loadingAccepts.includes(request.id) || loadingDenies.includes(request.id)}
							class="{loadingDenies.includes(request.id) ? 'loading' : ''} btn btn-sm btn-ghost"
							>Deny</button
						>
						<button
							on:click={() => acceptFriendRequest(request.id)}
							disabled={loadingAccepts.includes(request.id) || loadingDenies.includes(request.id)}
							class="{loadingAccepts.includes(request.id) ? 'loading' : ''} btn btn-sm btn-primary"
							>Accept</button
						>
					</div>
				</article>
			{:else}
				<p>No pending friend requests</p>
			{/each}
		</ul>
	{:catch error}
		<p>{error.message}</p>
	{/await}
	<div class="divider" />

	<form class="mb-3" on:submit|preventDefault={addNewFriend}>
		{#if errors}
			<p class="text-center text-error">{errors}</p>
		{/if}
		<dl class="w-full">
			<dt class="mb-3">
				<label for="newFriend" class="2xl font-bold">Add a new friend:</label>
			</dt>
			<dd class="flex gap-3 items-center">
				<input
					bind:value={newFriend}
					type="text"
					class="input input-bordered bg-base-200 w-full"
					id="newFriend"
					name="newFriend"
					placeholder="friendsUsername"
					on:focus={() => {
						errors = '';
						newFriend = '';
					}}
				/>
				<button class="{loadingNewFriend ? 'loading' : ''} btn h-full" type="submit">Add</button>
			</dd>
		</dl>
	</form>
	<div class="divider" />
</main>
