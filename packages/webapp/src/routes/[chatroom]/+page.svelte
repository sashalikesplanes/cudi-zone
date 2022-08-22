<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { user } from '$lib/stores';
	import { goto } from '$app/navigation';
	import VideoChat from './VideoChat.svelte';
	import Torrent from './Torrent.svelte';

	onMount(async () => {
		if (!$user) {
		  goto('/');
		  return;
    }
    });
</script>

<main class="flex">
  <Torrent />
  <div class="divider divider-horizontal mx-1 w-0" />
  <VideoChat/>
</main>
