pc = new RTCPeerConnection(stunServers);
localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
if (localStream.getTracks().length === 0) errors += 'no local video streams; ';
localStream.getTracks().forEach((track) => pc.addTrack(track, localStream)); 


// Add local stream to local video
localVideo.srcObject = localStream;
localVideo.volume = 0;

pc.oniceconnectionstatechange = (event) => console.log('ICE State: ', pc.iceConnectionState);

sendMessage({
  from: [$user.id],
  to: [$user.partnerId],
  messageType: 'video-offer',
  payload: pc.localDescription
});


const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
function handleNewIce(event: RTCPeerConnectionIceEvent) { if (!$user) {
  errors += 'no user when found new ice candidate; ';
  return;
}

  if (!event.candidate) return;
  sendMessage({
    to: [$user.partnerId],
    from: [$user.id],
    messageType: 'new-ice',
    payload: event.candidate
  });
}

        // Add local stream to peer connection
        pc = new RTCPeerConnection(stunServers);
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localStream.getTracks().length === 0) errors += 'no local video streams; ';
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

        // Add local stream to local video
        localVideo.srcObject = localStream;
        localVideo.volume = 0;
        // add offer, make answer, send answer, create ice listener
        const offerDesc = new RTCSessionDescription(payload);
        await pc.setRemoteDescription(offerDesc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        pc.oniceconnectionstatechange = (event) => console.log('ICE State: ', pc.iceConnectionState);

        sendMessage({
          from: [$user.id],
          to: [$user.partnerId],
          messageType: 'video-answer',
          payload: pc.localDescription
        });

        // new tracks must be coming from remote, hence add to remote video
        remoteStream = new MediaStream();
        pc.ontrack = (event) => {
          console.log('recieved track: ', event.track);
          remoteStream.addTrack(event.track);
          event.track.onunmute = () => {
            console.log('unmuted track: ', event.track);
            remoteStream.addTrack(event.track);
            // Add remote stream (empty now) to remote video
            remoteVideo.srcObject = remoteStream;
          }
        }




        pc.onicecandidate = (event) => handleNewIce(event);
