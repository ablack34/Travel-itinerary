<script lang="ts">
  import type { Day } from '../lib/types';
  import { getDayDate, formatDate } from '../lib/dates';
  import DayCard from './DayCard.svelte';

  interface Props {
    days: Day[];
    editing: boolean;
    onchange: () => void;
  }

  let { days, editing, onchange }: Props = $props();

  interface Week {
    weekNum: number;
    label: string;
    days: { day: Day; index: number }[];
  }

  const weeks = $derived(() => {
    const result: Week[] = [];
    for (let i = 0; i < days.length; i += 7) {
      const chunk = days.slice(i, i + 7);
      const startDate = getDayDate(i);
      const endDate = getDayDate(Math.min(i + 6, days.length - 1));
      const weekNum = Math.floor(i / 7) + 1;
      const isLast = i + 7 >= days.length;
      const label = `📅 Week ${weekNum}: ${formatDate(startDate)} – ${formatDate(endDate)}${isLast ? ' (Final Days)' : ''}`;
      result.push({
        weekNum,
        label,
        days: chunk.map((day, j) => ({ day, index: i + j })),
      });
    }
    return result;
  });
</script>

<div class="max-w-[1400px] mx-auto">
  {#each weeks() as week}
    <div class="week-container">
      <div class="week-header">{week.label}</div>
      <div class="week-grid">
        {#each week.days as { day, index }}
          <DayCard {day} {index} {editing} {onchange} />
        {/each}
      </div>
    </div>
  {/each}
</div>
