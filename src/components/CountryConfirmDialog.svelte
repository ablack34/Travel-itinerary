<script lang="ts">
  import type { Day } from '../lib/types';

  interface Props {
    movedDay: Day;
    neighbourCountry: string;
    onkeep: () => void;
    onchangecountry: () => void;
    oncancel: () => void;
  }

  let { movedDay, neighbourCountry, onkeep, onchangecountry, oncancel }: Props = $props();

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
  onkeydown={(e) => e.key === 'Escape' && oncancel()}
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="bg-[#1e2a3a] rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl"
    onclick={(e) => e.stopPropagation()}
  >
    <h3 class="text-lg font-bold text-[#f39c12] mb-3">⚠️ Country Boundary Change</h3>
    <p class="text-[#ccc] text-sm mb-5">
      Moving "<span class="font-semibold text-white">{movedDay.location}</span>"
      (<span class="text-white">{capitalize(movedDay.country)}</span>)
      between <span class="font-semibold text-white">{capitalize(neighbourCountry)}</span> days.
    </p>
    <div class="flex flex-col gap-2">
      <button class="confirm-btn keep" onclick={onkeep}>
        Keep {capitalize(movedDay.country)}
      </button>
      <button class="confirm-btn change" onclick={onchangecountry}>
        Change to {capitalize(neighbourCountry)}
      </button>
      <button class="confirm-btn cancel" onclick={oncancel}>
        Cancel
      </button>
    </div>
  </div>
</div>
