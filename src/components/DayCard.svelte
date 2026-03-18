<script lang="ts">
  import type { Day } from '../lib/types';
  import { getDayDate, formatDate, formatWeekday } from '../lib/dates';

  interface Props {
    day: Day;
    index: number;
  }

  let { day, index }: Props = $props();

  const date = $derived(getDayDate(index));
  const dateStr = $derived(formatDate(date));
  const weekday = $derived(formatWeekday(date));
  const dayNum = $derived(index + 1);

  const linkIcon: Record<string, string> = {
    accommodation: '🏨',
    tour: '🎫',
    transport: '🚌',
    restaurant: '🍽️',
    other: '🔗',
  };
</script>

<div class="day-card day-card-{day.country}">
  <div class="flex justify-between items-start mb-2">
    <div>
      <div class="text-lg font-bold text-white">{dateStr}</div>
      <div class="text-xs text-[#aaa] uppercase">{weekday}</div>
    </div>
    <div class="text-xs text-white/40">Day {dayNum}</div>
  </div>

  <div class="font-bold text-[0.95rem] mb-2 text-white">{day.location}</div>

  {#if day.activities.length > 0}
    <div class="text-[0.8rem] text-[#ccc] leading-relaxed">
      {#each day.activities as activity}
        <div class="activity-item">
          {#if activity.isHighlight}
            <span class="highlight">{activity.text}</span>
          {:else}
            {activity.text}
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if day.links.length > 0}
    <div class="mt-2 pt-2 border-t border-white/10 text-xs">
      {#each day.links as link}
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#f39c12] hover:underline flex items-center gap-1 mb-1"
        >
          {linkIcon[link.type] || '🔗'} {link.label}
        </a>
      {/each}
    </div>
  {/if}
</div>
