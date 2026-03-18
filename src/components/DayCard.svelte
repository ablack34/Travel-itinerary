<script lang="ts">
  import type { Day } from '../lib/types';
  import { getDayDate, formatDate, formatWeekday } from '../lib/dates';
  import ActivityList from './ActivityList.svelte';
  import LinksEditor from './LinksEditor.svelte';

  interface Props {
    day: Day;
    index: number;
    editing: boolean;
    onchange: () => void;
  }

  let { day, index, editing, onchange }: Props = $props();

  const date = $derived(getDayDate(index));
  const dateStr = $derived(formatDate(date));
  const weekday = $derived(formatWeekday(date));
  const dayNum = $derived(index + 1);

  const countries: Day['country'][] = ['peru', 'bolivia', 'chile', 'travel', 'home'];

  function updateLocation(value: string) {
    day.location = value;
    onchange();
  }

  function updateCountry(value: Day['country']) {
    day.country = value;
    onchange();
  }
</script>

<div class="day-card day-card-{day.country}">
  <div class="flex justify-between items-start mb-2">
    <div>
      <div class="text-lg font-bold text-white">{dateStr}</div>
      <div class="text-xs text-[#aaa] uppercase">{weekday}</div>
    </div>
    <div class="text-xs text-white/40">Day {dayNum}</div>
  </div>

  {#if editing}
    <select
      class="edit-select text-xs mb-2 w-full"
      value={day.country}
      onchange={(e) => updateCountry((e.target as HTMLSelectElement).value as Day['country'])}
    >
      {#each countries as c}
        <option value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
      {/each}
    </select>
    <input
      type="text"
      class="edit-input w-full font-bold text-[0.95rem] mb-2"
      value={day.location}
      placeholder="Location..."
      oninput={(e) => updateLocation((e.target as HTMLInputElement).value)}
    />
  {:else}
    <div class="font-bold text-[0.95rem] mb-2 text-white">{day.location}</div>
  {/if}

  <ActivityList activities={day.activities} {editing} {onchange} />
  <LinksEditor links={day.links} {editing} {onchange} />
</div>
