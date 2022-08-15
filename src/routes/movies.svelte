<script lang="ts">
	import { onMount } from 'svelte';
	import { session } from '$app/stores';
	import { clientState } from '$lib/stores';
import { goto } from '$app/navigation';

	let player: HTMLVideoElement;
	let ws: WebSocket;

	let state = 'paused';
	let magnetURI = "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent";
	let currentTime: number;

	// allow 2 servers in dev for HMR, but 1 server for prod
	const expressHost = import.meta.env.DEV ? 'localhost:3001' : location.host;

	$: if (!$session.user) goto('/profile');

	function sendMessage(msg: string, data?: any) {
		ws.send(JSON.stringify({ msg, data }));
	}

	onMount(() => {
		ws = new WebSocket(`ws://${expressHost}/sync`);
		ws.onerror = (event) => {
			state = 'error';
			console.error(event);
		};

		ws.onopen = () => {
			state = 'connected';
			sendMessage('clientConnection', [$session.user.id, $clientState.partnerId]);
		};

		ws.onmessage = (event) => {
			const { msg, data } = JSON.parse(event.data);
			console.log(msg);
			if (msg === 'serverRecievedTorrent') state = 'server loading';
			else if (msg === 'serverTorrentReady') {
				state = 'client loading';
				player.src = `http://${expressHost}/video/${data}`;
			} else if (msg === 'playbackReady') state = 'paused';
			else if (msg === 'play') {
				state = 'playing';
				player.play();
			} else if (msg === 'pause') {
				state = 'paused';
				player.pause();
			} else if (msg === 'seekedTo') {
			  currentTime = Number(data);
			}
		};

		ws.onclose = () => console.log('WEB SOCKET Closed');
		ws.onerror = (e) => console.log('Error with WEB SOCKET ', e);

		return () => ws.close();
	});
</script>

<main class="flex gap-3 p-3">
	<video
		bind:this={player}
    bind:currentTime
    controls
    on:pause|preventDefault={() => sendMessage('pause')}
    on:play|preventDefault={() => sendMessage('play')}
    on:seeking|preventDefault={() => sendMessage('pause')}
    on:seeked|preventDefault={() => sendMessage('seekedTo', String(currentTime))}
		on:canplay={() => sendMessage('clientCanPlay')}
		class="flex-grow border-base-300 border"
	/>
	<div class="w-fit flex flex-col gap-3">
		<p class="font-bold text-center text-2xl">{state}</p>
		<p class="font-bold text-center text-2xl">{Number(currentTime || 0).toFixed(3)}</p>
		<input
			bind:value={magnetURI}
			type="text"
			class="input w-full bg-base-300"
			placeholder="magnet..."
			name="magnet"
			id="magnet"
		/>
		<button
			class="btn"
			on:click={() => sendMessage('clientSubmitTorrent', magnetURI)}
			disabled={state !== 'connected'}>Submit torrent</button
		>
		{#if state === 'playing'}
			<button class="btn" on:click={() => sendMessage('pause')}>Pause</button>
		{:else if state === 'paused'}
			<button class="btn" on:click={() => sendMessage('play')}>Play</button>
		{/if}
	</div>
</main>
