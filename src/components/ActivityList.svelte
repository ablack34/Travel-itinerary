<script lang="ts">
  import type { Activity } from '../lib/types';

  interface Props {
    activities: Activity[];
    editing: boolean;
    onchange: () => void;
  }

  let { activities, editing, onchange }: Props = $props();

  function updateText(index: number, text: string) {
    activities[index].text = text;
    onchange();
  }

  function toggleHighlight(index: number) {
    activities[index].isHighlight = !activities[index].isHighlight;
    onchange();
  }

  function remove(index: number) {
    activities.splice(index, 1);
    onchange();
  }

  function add() {
    activities.push({
      id: crypto.randomUUID(),
      text: '',
      isHighlight: false,
    });
    onchange();
  }
</script>

{#if !editing}
  {#if activities.length > 0}
    <div class="text-[0.8rem] text-[#ccc] leading-relaxed">
      {#each activities as activity}
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
{:else}
  <div class="space-y-1.5">
    {#each activities as activity, i}
      <div class="flex items-center gap-1 group">
        <button
          type="button"
          class="text-xs opacity-50 hover:opacity-100 shrink-0"
          class:text-[#f39c12]={activity.isHighlight}
          title="Toggle highlight"
          onclick={() => toggleHighlight(i)}
        >
          ★
        </button>
        <input
          type="text"
          class="edit-input flex-1 text-[0.8rem]"
          value={activity.text}
          placeholder="Activity..."
          oninput={(e) => updateText(i, (e.target as HTMLInputElement).value)}
        />
        <button
          type="button"
          class="text-red-400/60 hover:text-red-400 text-sm shrink-0"
          title="Remove"
          onclick={() => remove(i)}
        >
          ×
        </button>
      </div>
    {/each}
    <button
      type="button"
      class="text-xs text-[#f39c12]/70 hover:text-[#f39c12] mt-1"
      onclick={add}
    >
      + Add activity
    </button>
  </div>
{/if}
