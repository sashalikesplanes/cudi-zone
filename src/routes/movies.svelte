<script lang="ts">
	import { onMount } from 'svelte';

	let player: HTMLVideoElement;
	let ws: WebSocket;

	let state = 'paused';
	let magnetURI: string;
	let currentTime: number;

	function sendMessage(msg: string, data?: string) {
		ws.send(JSON.stringify({ msg, data }));
	}

	onMount(() => {
		ws = new WebSocket('ws://' + location.host + '/state');
		ws.onerror = (event) => {
			state = 'error';
			console.error(event);
		};

		ws.onopen = () => {
			state = 'connected';
		};

		ws.onmessage = (event) => {
			const { msg, data } = JSON.parse(event.data);
			if (msg === 'serverRecievedTorrent') state = 'server loading';
			else if (msg === 'serverTorrentReady') {
				state = 'client loading';
				player.src = `/video/${data}`;
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
		class="flex-grow flex-shrink border-base-300 border"
	/>
	<div class="w-fit flex flex-col gap-3">
		<p class="font-bold text-center text-2xl">{state}</p>
		<p class="font-bold text-center text-2xl">{currentTime}</p>
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
