<script lang="ts">
  import type { Itinerary } from './lib/types';
  import { loadItinerary } from './lib/api';
  import Header from './components/Header.svelte';
  import WeekGrid from './components/WeekGrid.svelte';

  let itinerary = $state<Itinerary | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(true);

  $effect(() => {
    loadItinerary()
      .then((data) => {
        itinerary = data;
        loading = false;
      })
      .catch((e) => {
        error = e.message;
        loading = false;
      });
  });
</script>

<main class="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white p-5">
  {#if loading}
    <div class="flex items-center justify-center h-screen">
      <p class="text-xl text-gray-400">Loading itinerary...</p>
    </div>
  {:else if error}
    <div class="flex items-center justify-center h-screen">
      <p class="text-xl text-red-400">Error: {error}</p>
    </div>
  {:else if itinerary}
    <Header title={itinerary.title} travelers={itinerary.travelers} days={itinerary.days} />
    <WeekGrid days={itinerary.days} />
    <div class="text-center mt-10 text-[#666] text-sm">
      <p>✨ {itinerary.days.length} Days • 3 Countries • Countless Adventures ✨</p>
      <p class="mt-2">{itinerary.travelers.join(' & ')} • Summer 2026</p>
    </div>
  {/if}
</main>
