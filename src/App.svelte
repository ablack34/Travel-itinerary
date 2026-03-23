<script lang="ts">
  import type { Itinerary, Day } from './lib/types';
  import { loadItinerary, saveItinerary, listFiles } from './lib/api';
  import { getDayKey, formatDate, getDayDate, formatWeekday } from './lib/dates';
  import Header from './components/Header.svelte';
  import TodoList from './components/TodoList.svelte';
  import WeekGrid from './components/WeekGrid.svelte';
  import CountryConfirmDialog from './components/CountryConfirmDialog.svelte';
  import AttachmentModal from './components/AttachmentModal.svelte';

  let itinerary = $state<Itinerary | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(true);
  let editing = $state(false);
  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let savedClearTimeout: ReturnType<typeof setTimeout> | null = null;

  // Drag state
  let draggingIndex = $state<number | null>(null);

  // Country confirm dialog state
  let confirmDialog = $state<{
    movedDay: Day;
    neighbourCountry: string;
    fromIndex: number;
    toIndex: number;
  } | null>(null);

  // Attachment state
  let attachmentCounts = $state<Record<string, number>>({});
  let attachmentModal = $state<{ dayKey: string; dayLabel: string } | null>(null);

  $effect(() => {
    loadItinerary()
      .then((data) => {
        itinerary = data;
        loading = false;
        loadAttachmentCounts();
      })
      .catch((e) => {
        error = e.message;
        loading = false;
      });
  });

  function toggleEdit() {
    editing = !editing;
    if (!editing && itinerary) {
      if (saveTimeout) clearTimeout(saveTimeout);
      doSave();
    }
  }

  function onchange() {
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

  function onDragStart(index: number) {
    draggingIndex = index;
  }

  function onDrop(toIndex: number) {
    if (!itinerary || draggingIndex === null || draggingIndex === toIndex) {
      draggingIndex = null;
      return;
    }
    const fromIndex = draggingIndex;
    draggingIndex = null;

    const movedDay = itinerary.days[fromIndex];

    // Determine the dominant neighbour country at the target position
    const neighbourCountry = getNeighbourCountry(itinerary.days, fromIndex, toIndex);

    if (neighbourCountry && movedDay.country !== neighbourCountry) {
      // Show confirmation dialog
      confirmDialog = { movedDay, neighbourCountry, fromIndex, toIndex };
    } else {
      // No country conflict — just reorder
      performReorder(fromIndex, toIndex);
    }
  }

  function getNeighbourCountry(days: Day[], fromIndex: number, toIndex: number): string | null {
    // After removal, what would the neighbours be at toIndex?
    const without = days.filter((_, i) => i !== fromIndex);
    const insertAt = toIndex > fromIndex ? toIndex - 1 : toIndex;
    const before = insertAt > 0 ? without[insertAt - 1] : null;
    const after = insertAt < without.length ? without[insertAt] : null;

    // Pick the neighbour country (prefer the one that's not travel/home)
    const candidates = [before?.country, after?.country].filter(
      (c) => !!c && c !== 'travel' && c !== 'home'
    ) as string[];
    return candidates[0] ?? null;
  }

  function performReorder(fromIndex: number, toIndex: number) {
    if (!itinerary) return;
    const [moved] = itinerary.days.splice(fromIndex, 1);
    const insertAt = toIndex > fromIndex ? toIndex - 1 : toIndex;
    itinerary.days.splice(insertAt, 0, moved);
    onchange();
  }

  function confirmKeep() {
    if (!confirmDialog) return;
    performReorder(confirmDialog.fromIndex, confirmDialog.toIndex);
    confirmDialog = null;
  }

  function confirmChangeCountry() {
    if (!confirmDialog || !itinerary) return;
    const day = itinerary.days[confirmDialog.fromIndex];
    day.country = confirmDialog.neighbourCountry as Day['country'];
    performReorder(confirmDialog.fromIndex, confirmDialog.toIndex);
    confirmDialog = null;
  }

  function confirmCancel() {
    confirmDialog = null;
  }

  // ---- Attachments ----

  function loadAttachmentCounts() {
    if (!itinerary) return;
    for (let i = 0; i < itinerary.days.length; i++) {
      const key = getDayKey(i);
      listFiles(key).then((files) => {
        if (files.length > 0) {
          attachmentCounts[key] = files.length;
        }
      });
    }
  }

  function openAttachments(index: number) {
    const key = getDayKey(index);
    const date = getDayDate(index);
    const label = `${formatDate(date)} (${formatWeekday(date)})`;
    attachmentModal = { dayKey: key, dayLabel: label };
  }

  function onAttachmentCountChange(dayKey: string, count: number) {
    attachmentCounts[dayKey] = count;
  }

  function closeAttachmentModal() {
    attachmentModal = null;
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
    <TodoList
      travelers={itinerary.travelers}
    />
    <WeekGrid
      days={itinerary.days}
      {editing}
      {onchange}
      ondragstart={onDragStart}
      ondrop={onDrop}
      {draggingIndex}
      {attachmentCounts}
      onopenattachments={openAttachments}
    />
    <div class="text-center mt-10 text-[#666] text-sm">
      <p>✨ {itinerary.days.length} Days • 3 Countries • Countless Adventures ✨</p>
      <p class="mt-2">{itinerary.travelers.join(' & ')} • Summer 2026</p>
    </div>
  {/if}
</main>

{#if confirmDialog}
  <CountryConfirmDialog
    movedDay={confirmDialog.movedDay}
    neighbourCountry={confirmDialog.neighbourCountry}
    onkeep={confirmKeep}
    onchangecountry={confirmChangeCountry}
    oncancel={confirmCancel}
  />
{/if}

{#if attachmentModal}
  <AttachmentModal
    dayKey={attachmentModal.dayKey}
    dayLabel={attachmentModal.dayLabel}
    onclose={closeAttachmentModal}
    oncountchange={onAttachmentCountChange}
  />
{/if}
