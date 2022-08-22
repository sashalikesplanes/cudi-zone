<script lang="ts">
	import type { ServerMessage, ClientMessage } from '$lib/messages';
	import { onDestroy, onMount } from 'svelte';
	import { user } from '$lib/stores';
	import { onMessage, sendMessage, unsubcribeFromMessages } from '$lib/ws-messenger';
	import { goto } from '$app/navigation';

	const videoUrl = import.meta.env.DEV
		? 'http://localhost:3003/torrent'
		: 'https://cudiserver.kiselev.lu/torrent';
	let player: HTMLVideoElement;
	let magnetURI =
		'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';
	let currentTime: number;
	let errors = '';
	let state = {
		selfPlaybackReady: false,
		partnerPlaybackReady: false,
	};

	$: playbackReady = state.partnerPlaybackReady && state.selfPlaybackReady;

	onMount(() => {
		if (!$user) {
			goto('/');
			return;
		}

		onMessage($user.id, $user.partnerId, handleMessage);
		// send initial message?
	});

	async function handleMessage({ from, messageType, payload }: ServerMessage) {
		if (!$user) {
			errors += 'no user; ';
			return;
		}

		switch (messageType) {
			case 'torrent-ready':
				player.src = `${videoUrl}/${payload}`;
				break;

			case 'playback-ready':
			  state.partnerPlaybackReady = true;
			  state = state;
			  break;

			case 'play':
			  player.play();
			  break;

			case 'pause':
			  player.pause();
			  break;

			case 'seek-to':
			  currentTime = payload;
			  break;
		}
	}

	function handlePlay() {
	  setTimeout(() => {
      if (!$user) {
        errors += 'no user in handlePlay; ';
        return;
      }
      sendMessage({
        from: [$user.id],
        to: [$user.id, $user.partnerId],
        messageType: 'play',
        payload: undefined,
      })
	  }, 500)
	}

	function handlePause() {
	  if (!$user) {
	    errors += 'no user in handlePause; ';
	    return;
	  }
    sendMessage({
      from: [$user.id],
      to: [$user.id, $user.partnerId],
      messageType: 'pause',
      payload: undefined,
    })
	}

	function handleSeek() {
	  if (!$user) {
	    errors += 'no user in handleSeek; ';
	    return;
	  }
	  sendMessage({
	    from: [$user.id],
	    to: [$user.id, $user.partnerId],
	    messageType: 'seek-to',
	    payload: currentTime
	  })
	}

	onDestroy(() => {
		unsubcribeFromMessages(handleMessage);
	});
</script>

<section class="flex flex-col gap-4 flex-grow">
	{#if $user}
		<video
			bind:this={player}
			bind:currentTime
			controls
			on:canplay={() => {
				state.selfPlaybackReady = true;
				state = state;
				sendMessage({
					// @ts-ignore, checked for user
					from: [$user.id],
					// @ts-ignore, checked for user
					to: [$user.partnerId],
					messageType: 'playback-ready',
					payload: undefined
				});
			}}
			on:play|preventDefault={handlePlay}
			on:pause|preventDefault={handlePause}
			on:seeking|preventDefault={handlePause}
			on:seeked|preventDefault={handleSeek}
		/>
		<p class="text-error text-center">{errors}</p>
		<div class="w-11/12 justify-center flex gap-3 mx-auto ">
			<input
				bind:value={magnetURI}
				type="text"
				class="input w-full bg-base-300 "
				placeholder="magnet..."
				name="magnet"
				id="magnet"
			/>

			<button
				class="btn"
				on:click={() => {
					sendMessage({
						// @ts-ignore, already checked for user existence
						from: [$user.id, $user.partnerId],
						to: ['torrentServer'],
						messageType: 'add-torrent',
						payload: magnetURI
					});
				}}>Submit torrent</button
			>

			{#if playbackReady}
				{#if player.paused}
					<button class="btn" on:click={handlePlay}>Play</button>
				{:else}
					<button class="btn" on:click={handlePause}>Pause</button>
				{/if}
			{/if}
		</div>
	{:else}
		<p>Error no user</p>
	{/if}
</section>
