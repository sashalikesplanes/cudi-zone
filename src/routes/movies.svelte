<script lang="ts">
	import { onMount } from 'svelte';
	import { session } from '$app/stores';
	import { clientState } from '$lib/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/env';

	let player: HTMLVideoElement;
	let ws: WebSocket;

	let state = 'paused';
	let errors = '';
	let magnetURI =
		'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';
	let currentTime: number;

	const stunServers = {
		iceServers: [
			{
				urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
			}
		],
		iceCandidatePoolSize: 10 // why?
	};

	let pc;
	let localStream = null;
	let remoteStream = null;
	let localVideo;
	let remoteVideo;

	// allow 2 servers in dev for HMR, but 1 server for prod
	// const expressHost = import.meta.env.DEV ? 'localhost:3001' : location.host;
	const expressHost = 'localhost:3001';

	function sendMessage(msg: string, data?: any) {
		ws.send(JSON.stringify({ msg, data }));
	}

	onMount(async () => {
		if (!$session.user) goto('/profile');
		pc = new RTCPeerConnection(stunServers);

		localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
		remoteStream = new MediaStream();

		// add video local video tracks to peer connection
		localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

		pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
		}
  
    localVideo.srcObject = localStream;
    localVideo.volume = 0;
    remoteVideo.srcObject = remoteStream;

		// TODO abstract and refactor
		ws = new WebSocket(`ws://${expressHost}/sync?id=${$session.user.id}`);
		ws.onerror = (event) => {
			state = 'error';
			console.error(event);
		};

		ws.onopen = () => {
			state = 'connected to server';
			sendMessage('clientConnection', $clientState.partnerId);
			pc.onicecandidate = (event) => {
			  if (!event.candidate) return;
			  sendMessage('newCandidate', JSON.stringify(event.candidate));
			}
		};

		ws.onmessage = async (event) => {
			const { msg, data } = JSON.parse(event.data);
			console.log(msg);
      if (msg === 'firstClientConnected') {
        state = 'First connected';
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);

        const offer = pc.localDescription;
        /* pc.onicecandidate = (event) => {
          event.candidate && sendMessage('newOfferCandidate', event.candidate.toJSON());
        } */
        sendMessage('newOffer', JSON.stringify(offer));

      }
      else if (msg === 'secondClientConnected') {
        // only for the second client
        state = 'Second connected';
        const offer = JSON.parse(data);
        const anwserDescription = new RTCSessionDescription(offer);
        await pc.setRemoteDescription(anwserDescription);

        const anwser = await pc.createAnswer()
        pc.setLocalDescription(anwser);
        sendMessage('newAnswer', JSON.stringify(anwser));
      } else if (msg === 'newAnswer') {
        if (state !== 'Second connected') {
          pc.setRemoteDescription(JSON.parse(data));
        }
        state = 'call established'
      } else if (msg === 'newCandidate') {
        const newCandidate = new RTCIceCandidate(JSON.parse(data));
        pc.addIceCandidate(newCandidate);
      } else if (msg === 'serverRecievedTorrent') state = 'server loading';
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
			} else if (msg === 'error') {
				errors += data + '; ';
			}
		};

		ws.onclose = () => {
			errors += 'WebSocket closed; ';
			console.log('WEB SOCKET Closed');
		};
		ws.onerror = (e) => console.log('Error with WEB SOCKET ', e);

		return () => ws.close();
	});
</script>

<main class="flex gap-1">
	<video
		bind:this={player}
		bind:currentTime
		controls
		on:pause|preventDefault={() => sendMessage('pause')}
		on:play|preventDefault={() => sendMessage('play')}
		on:seeking|preventDefault={() => sendMessage('pause')}
		on:seeked|preventDefault={() => sendMessage('seekedTo', String(currentTime))}
		on:canplay={() => sendMessage('clientReady')}
		class="flex-grow"
	/>
	<div class="relative h-11/12 w-48">
		<video bind:this={remoteVideo} class="border-error border-2" autoplay playsinline />
		<video bind:this={localVideo} class="border-warning border-2" autoplay playsinline />
	</div>
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
	<button
		class="btn "
		on:click={() => sendMessage('clientSubmitTorrent', magnetURI)}
		disabled={state !== 'call established'}>Submit torrent</button
	>
	{#if state === 'playing'}
		<button class="btn " on:click={() => sendMessage('pause')}>Pause</button>
	{:else if state === 'paused'}
		<button class="btn " on:click={() => sendMessage('play')}>Play</button>
	{/if}
</div>
