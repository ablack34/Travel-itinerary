<script lang="ts">
  import type { Day } from '../lib/types';
  import SaveIndicator from './SaveIndicator.svelte';

  interface Props {
    title: string;
    travelers: string[];
    days: Day[];
    editing: boolean;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    ontoggleedit: () => void;
  }

  let { title, travelers, days, editing, saveStatus, ontoggleedit }: Props = $props();

  const countryCounts = $derived(() => {
    const counts: Record<string, number> = {};
    for (const day of days) {
      counts[day.country] = (counts[day.country] || 0) + 1;
    }
    return counts;
  });

  const peruCount = $derived(countryCounts().peru || 0);
  const boliviaCount = $derived(countryCounts().bolivia || 0);
  const chileCount = $derived(countryCounts().chile || 0);
  const uniqueCountries = $derived(
    new Set(days.map((d) => d.country).filter((c) => c !== 'travel' && c !== 'home')).size
  );

  const peruPct = $derived(Math.round((peruCount / days.length) * 100));
  const boliviaPct = $derived(Math.round((boliviaCount / days.length) * 100));
  const chilePct = $derived(100 - peruPct - boliviaPct);
</script>

<div class="text-center mb-8 px-5">
  <h1
    class="text-4xl font-bold bg-gradient-to-r from-[#f39c12] via-[#e74c3c] to-[#9b59b6] bg-clip-text text-transparent"
  >
    🌍 {title}
  </h1>
  <div class="text-[#aaa] text-lg mt-2">
    <strong>South America Adventure</strong><br />
    {travelers.join(' & ')} • June 27 – August 10, 2026 • {days.length} Days
  </div>
  <div class="mt-4 flex items-center justify-center">
    <button class="edit-toggle-btn" class:editing onclick={ontoggleedit}>
      {#if editing}
        ✓ Done
      {:else}
        ✏️ Edit
      {/if}
    </button>
    <SaveIndicator status={saveStatus} />
  </div>
</div>

<!-- Stats -->
<div class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 mb-8 max-w-[1400px] mx-auto">
  <div class="stat-card">
    <div class="stat-number">{days.length}</div>
    <div class="stat-label">Total Days</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">{uniqueCountries}</div>
    <div class="stat-label">Countries</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">~{peruCount}</div>
    <div class="stat-label">Days in Peru</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">~{boliviaCount}</div>
    <div class="stat-label">Days in Bolivia</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">~{chileCount}</div>
    <div class="stat-label">Days in Chile</div>
  </div>
</div>

<!-- Timeline -->
<div class="bg-white/5 rounded-2xl p-5 mb-8 max-w-[1400px] mx-auto">
  <div class="flex h-[30px] rounded-2xl overflow-hidden">
    <div
      class="flex items-center justify-center text-xs font-bold text-white timeline-peru"
      style="width: {peruPct}%;"
    >
      🇵🇪 Peru (Days 1-{peruCount})
    </div>
    <div
      class="flex items-center justify-center text-xs font-bold text-white timeline-bolivia"
      style="width: {boliviaPct}%;"
    >
      🇧🇴 Bolivia ({peruCount + 1}-{peruCount + boliviaCount})
    </div>
    <div
      class="flex items-center justify-center text-xs font-bold text-white timeline-chile"
      style="width: {chilePct}%;"
    >
      🇨🇱 Chile ({peruCount + boliviaCount + 1}-{days.length})
    </div>
  </div>
</div>

<!-- Legend -->
<div class="flex justify-center gap-8 mb-8 flex-wrap">
  <div class="flex items-center gap-2">
    <div class="w-5 h-5 rounded legend-peru"></div>
    <span>Peru</span>
  </div>
  <div class="flex items-center gap-2">
    <div class="w-5 h-5 rounded legend-bolivia"></div>
    <span>Bolivia</span>
  </div>
  <div class="flex items-center gap-2">
    <div class="w-5 h-5 rounded legend-chile"></div>
    <span>Chile</span>
  </div>
  <div class="flex items-center gap-2">
    <div class="w-5 h-5 rounded legend-travel"></div>
    <span>Travel Day</span>
  </div>
  <div class="flex items-center gap-2">
    <div class="w-5 h-5 rounded legend-home"></div>
    <span>Home</span>
  </div>
</div>
