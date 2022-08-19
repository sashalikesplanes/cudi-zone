<script lang="ts">
  import { page } from '$app/stores';
</script>
<h1 class="text-center my-20 font-bold text-4xl">Oopsie there was an oopsie {$page.status}</h1>
<p class="text-center text-2xl">{$page.error.message}</p>
<pre>{$page.error.stack}</pre>

