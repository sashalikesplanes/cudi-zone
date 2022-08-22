<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { user } from '$lib/stores';
	import { goto } from '$app/navigation';
	import type { ServerMessage } from '$lib/messages';
	import { onMessage, unsubcribeFromMessages } from '$lib/ws-messenger'; 
	import VideoChat from './VideoChat.svelte';
	import Torrent from './Torrent.svelte';

	onMount(async () => {
	  if (!$user || !$user.partnerId) {
      goto('/');
      return;
	  } 

    onMessage($user.id, $user.partnerId, handleMessages);
  });

  function handleMessages({ from, messageType, payload }: ServerMessage) {
    if (!$user) return;
    if (messageType === 'disconnect' && payload === $user.partnerId) goto('/');
  }

  onDestroy(() => {
    unsubcribeFromMessages(handleMessages);
  })
</script>

<main class="flex">
  <Torrent />
  <div class="divider divider-horizontal mx-1 w-0" />
  <VideoChat/>
</main>
