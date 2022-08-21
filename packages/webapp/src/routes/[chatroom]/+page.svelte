<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { user } from '$lib/stores';
	import { goto } from '$app/navigation';
	import type { ServerMessage, ClientMessage } from '$lib/messages';
	import VideoChat from './VideoChat.svelte';

	let player: HTMLVideoElement;
	let state = 'paused';
	let errors = '';
	let magnetURI =
		'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';
	let currentTime: number;


	onMount(async () => {
		if (!$user) {
		  goto('/');
		  return;
    }
    });
</script>

<main class="flex gap-1">
	<video bind:this={player} bind:currentTime controls class="flex-grow" />
	<!-- on:pause|preventDefault={() => sendMessage('pause')}
  on:play|preventDefault={() => sendMessage('play')}
  on:seeking|preventDefault={() => sendMessage('pause')}
  on:seeked|preventDefault={() => sendMessage('seekedTo', String(currentTime))}
  on:canplay={() => sendMessage('clientReady')} -->
</main>

<p class="text-error text-center">{errors}</p>
<div class="w-11/12 justify-center flex gap-3 mx-auto ">
	<p class="font-bold text-center text-xl ">State: {state}</p>
	<p class="font-bold text-center text-xl">Time: {Number(currentTime || 0).toFixed(2)} s</p>
	<input
		bind:value={magnetURI}
		type="text"
		class="input w-full bg-base-300 "
		placeholder="magnet..."
		name="magnet"
		id="magnet"
	/>
	<!-- on:click={() => sendMessage('clientSubmitTorrent', magnetURI)} -->
	<button class="btn " disabled={state !== 'call established'}>Submit torrent</button>
	{#if state === 'playing'}
		<button class="btn ">Pause</button>
	{:else if state === 'paused'}
		<button class="btn ">Play</button>
	{/if}
</div>
<VideoChat/>
