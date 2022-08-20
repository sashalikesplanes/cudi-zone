<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$lib/stores';
	import { goto } from '$app/navigation';

	// TODO move WS and WebRTC into a separate component that dispatches key events back here
	type MessageType = 'video-offer' | 'video-answer' | 'new-ice' | 'partner-check' | 'connection';
	interface Message {
		from: string;
		messageType: MessageType;
		payload: any | undefined;
	}
	interface SentMessage extends Message {
		to: string[];
	}

	let player: HTMLVideoElement;
	let state = 'paused';
	let errors = '';
	let magnetURI =
		'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';
	let currentTime: number;

	const stunServers = {
		iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }],
		iceCandidatePoolSize: 10 // why?
	};

	let pc: RTCPeerConnection;
	let localStream: MediaStream;
	let remoteStream: MediaStream;
	let localVideo: HTMLVideoElement;
	let remoteVideo: HTMLVideoElement;
	let ws: WebSocket;
	const wsUrl = import.meta.env.VITE_SERVER_URL;

	function sendMessage(ws: WebSocket, msg: SentMessage) {
		ws.send(JSON.stringify(msg));
	}

	function handleNewIce(event: RTCPeerConnectionIceEvent, ws: WebSocket) {
		if (!$user) {
			errors += 'no user when found new ice candidate; ';
			return;
		}

		if (!event.candidate) return;
		sendMessage(ws, {
			to: [$user.partnerId],
			from: $user.id,
			messageType: 'new-ice',
			payload: event.candidate
		});
	}

	onMount(async () => {
		if (!$user) goto('/profile');

		// Add local stream to peer connection
		pc = new RTCPeerConnection(stunServers);
		localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
		localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

		// Add local stream to local video
		localVideo.srcObject = localStream;
		localVideo.volume = 0;
		// Add remote stream (empty now) to remote video
		remoteVideo.srcObject = remoteStream;

		ws = new WebSocket(`${import.meta.env.DEV ? 'ws' : 'wss'}://${wsUrl}/message`);
		ws.onopen = () => {
			if (!$user) {
				errors += 'no user when WS opened; ';
				return;
			}

			sendMessage(ws, {
				to: [$user.partnerId],
				from: $user.id,
				messageType: 'partner-check',
				payload: undefined
			});
		};

		ws.onmessage = async (event) => {
			if (!$user) {
				errors += 'no user when recieving message; ';
				return;
			}

			const { from, messageType, payload } = JSON.parse(event.data) as Message;
			switch (messageType) {
				case 'partner-check':
					if (!payload) break;

					const offer = await pc.createOffer();
					await pc.setLocalDescription(offer);

					sendMessage(ws, {
						from: $user.id,
						to: [$user.partnerId],
						messageType: 'video-offer',
						payload: pc.localDescription
					});

					pc.onicecandidate = (event) => handleNewIce(event, ws);
					break;

				case 'video-offer':
					// add offer, make answer, send answer, create ice listener
					const offerDesc = new RTCSessionDescription(payload);
					await pc.setRemoteDescription(offerDesc);
					const answer = await pc.createAnswer();
					await pc.setLocalDescription(answer);

					sendMessage(ws, {
						from: $user.id,
						to: [$user.partnerId],
						messageType: 'video-answer',
						payload: pc.localDescription
					});

					pc.onicecandidate = (event) => handleNewIce(event, ws);
					break;

				case 'video-answer':
					const answerDesc = new RTCSessionDescription(payload);
					await pc.setRemoteDescription(answerDesc);
					break;

				case 'new-ice':
					// add the new ICE
					const candidate = new RTCIceCandidate(payload);
					pc.addIceCandidate(candidate); // could fail
					break;

				case 'connection':
					console.log('ws connected');
					break;

				default:
					console.log('unrecognized message type: ', messageType);
					errors += 'unrecognized message type; ';
					break;
			}
		};

		ws.onerror = (event) => {
			state = 'error';
			console.error(event);
		};

		ws.onclose = () => {
			errors += 'WebSocket closed; ';
			console.log('WEB SOCKET Closed');
		};

		return () => {
			ws.close();
			localStream.getTracks().forEach((track) => track.stop());
		  remoteStream.getTracks().forEach((track) => track.stop());
		};
	});
</script>

<main class="flex gap-1">
	<video bind:this={player} bind:currentTime controls class="flex-grow" />
	<!-- on:pause|preventDefault={() => sendMessage('pause')}
  on:play|preventDefault={() => sendMessage('play')}
  on:seeking|preventDefault={() => sendMessage('pause')}
  on:seeked|preventDefault={() => sendMessage('seekedTo', String(currentTime))}
  on:canplay={() => sendMessage('clientReady')} -->
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
	<!-- on:click={() => sendMessage('clientSubmitTorrent', magnetURI)} -->
	<button class="btn " disabled={state !== 'call established'}>Submit torrent</button>
	{#if state === 'playing'}
		<button class="btn ">Pause</button>
	{:else if state === 'paused'}
		<button class="btn ">Play</button>
	{/if}
</div>
</div>
