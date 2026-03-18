<script lang="ts">
  import type { Itinerary } from './lib/types';
  import { loadItinerary, saveItinerary } from './lib/api';
  import Header from './components/Header.svelte';
  import WeekGrid from './components/WeekGrid.svelte';

  let itinerary = $state<Itinerary | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(true);
  let editing = $state(false);
  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let savedClearTimeout: ReturnType<typeof setTimeout> | null = null;

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

  function toggleEdit() {
    editing = !editing;
    if (!editing && itinerary) {
      // Flush any pending save immediately when exiting edit mode
      if (saveTimeout) clearTimeout(saveTimeout);
      doSave();
    }
  }

  function onchange() {
    // Debounced auto-save: 500ms after last change
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(doSave, 500);
  }

  async function doSave() {
    if (!itinerary) return;
    saveTimeout = null;
    if (savedClearTimeout) clearTimeout(savedClearTimeout);
    saveStatus = 'saving';
    try {
      await saveItinerary(itinerary);
      saveStatus = 'saved';
      savedClearTimeout = setTimeout(() => {
        saveStatus = 'idle';
      }, 2000);
    } catch {
      saveStatus = 'error';
    }
  }
</script>

<main
  class="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white p-5 transition-shadow duration-300"
  class:edit-mode-glow={editing}
>
  {#if loading}
    <div class="flex items-center justify-center h-screen">
      <p class="text-xl text-gray-400">Loading itinerary...</p>
    </div>
  {:else if error}
    <div class="flex items-center justify-center h-screen">
      <p class="text-xl text-red-400">Error: {error}</p>
    </div>
  {:else if itinerary}
    <Header
      title={itinerary.title}
      travelers={itinerary.travelers}
      days={itinerary.days}
      {editing}
      {saveStatus}
      ontoggleedit={toggleEdit}
    />
    <WeekGrid days={itinerary.days} {editing} {onchange} />
    <div class="text-center mt-10 text-[#666] text-sm">
      <p>✨ {itinerary.days.length} Days • 3 Countries • Countless Adventures ✨</p>
      <p class="mt-2">{itinerary.travelers.join(' & ')} • Summer 2026</p>
    </div>
  {/if}
</main>
