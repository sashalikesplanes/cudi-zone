<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { ServerMessage } from '$lib/messages';
  import { user } from '$lib/stores';
  import { onMessage, sendMessage, unsubcribeFromMessages } from '$lib/ws-messenger';

	const stunServers = {
		iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }],
		iceCandidatePoolSize: 20
	};

	let errors = '';
	let pc: RTCPeerConnection;
	let localStream: MediaStream;
	let remoteStream: MediaStream;
	let localVideo: HTMLVideoElement;
	let remoteVideo: HTMLVideoElement;

	onMount(async () => {
	  if (!$user) {
	    errors += 'no user; ';
	    return;
	  }

    await onMessage($user.id, handleMessage);


		// Add local stream to peer connection
		pc = new RTCPeerConnection(stunServers);
		localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
		localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

		// new tracks must be coming from remote, hence add to remote video
		remoteStream = new MediaStream();
		pc.ontrack = (event) => {
		  console.log('recieved track: ', event.track);
		  event.track.onunmute = () => {
		    console.log('unmuted track: ', event.track);
        remoteStream.addTrack(event.track);
		  }
    }
		pc.oniceconnectionstatechange = (event) => console.log('ICE State: ', pc.iceConnectionState);

		// Add local stream to local video
		localVideo.srcObject = localStream;
		localVideo.volume = 0;
		// Add remote stream (empty now) to remote video
		remoteVideo.srcObject = remoteStream;

    sendMessage({
      to: ['wss'],
      from: $user.id,
      messageType: 'partner-check',
      payload: $user.partnerId
    });

	})


	async function handleMessage({ from, messageType, payload }: ServerMessage) {
	  console.log(messageType);
    function handleNewIce(event: RTCPeerConnectionIceEvent) {
      if (!$user) {
        errors += 'no user when found new ice candidate; ';
        return;
      }

      if (!event.candidate) return;
      sendMessage({
        to: [$user.partnerId],
        from: $user.id,
        messageType: 'new-ice',
        payload: event.candidate
      });
    }

	  if (!$user) {
	    errors += 'no user; ';
	    return;
    }

    switch (messageType) {
      case 'partner-check':
        if (!payload) break;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        sendMessage({
          from: $user.id,
          to: [$user.partnerId],
          messageType: 'video-offer',
          payload: pc.localDescription
        });

        pc.onicecandidate = (event) => handleNewIce(event);
        break;

      case 'video-offer':
        // add offer, make answer, send answer, create ice listener
        const offerDesc = new RTCSessionDescription(payload);
        await pc.setRemoteDescription(offerDesc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendMessage({
          from: $user.id,
          to: [$user.partnerId],
          messageType: 'video-answer',
          payload: pc.localDescription
        });

        pc.onicecandidate = (event) => handleNewIce(event);
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
    }
	}

  onDestroy(() => {
    if (pc) pc.close();
    if (localStream) localStream.getTracks().forEach((track) => track.stop());
    if (remoteStream) remoteStream.getTracks().forEach((track) => track.stop());
    unsubcribeFromMessages(handleMessage);
  })

</script>

<p class="text-error">{errors}</p>
<div class="relative h-11/12 w-48">
  <video bind:this={remoteVideo} class="border-error border-2" autoplay playsinline />
  <video bind:this={localVideo} class="border-warning border-2" autoplay playsinline />
</div>
