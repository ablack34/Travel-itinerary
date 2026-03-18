<script lang="ts">
  import type { Link } from '../lib/types';

  interface Props {
    links: Link[];
    editing: boolean;
    onchange: () => void;
  }

  let { links, editing, onchange }: Props = $props();

  const linkIcon: Record<string, string> = {
    accommodation: '🏨',
    tour: '🎫',
    transport: '🚌',
    restaurant: '🍽️',
    other: '🔗',
  };

  const linkTypes: Link['type'][] = ['accommodation', 'tour', 'transport', 'restaurant', 'other'];

  function updateLabel(index: number, label: string) {
    links[index].label = label;
    onchange();
  }

  function updateUrl(index: number, url: string) {
    links[index].url = url;
    onchange();
  }

  function updateType(index: number, type: Link['type']) {
    links[index].type = type;
    onchange();
  }

  function remove(index: number) {
    links.splice(index, 1);
    onchange();
  }

  function add() {
    links.push({
      id: crypto.randomUUID(),
      label: '',
      url: '',
      type: 'other',
    });
    onchange();
  }
</script>

{#if !editing}
  {#if links.length > 0}
    <div class="mt-2 pt-2 border-t border-white/10 text-xs">
      {#each links as link}
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
{:else}
  <div class="mt-2 pt-2 border-t border-white/10 space-y-2">
    {#each links as link, i}
      <div class="space-y-1 bg-white/5 rounded-lg p-2">
        <div class="flex items-center gap-1">
          <select
            class="edit-select text-xs"
            value={link.type}
            onchange={(e) => updateType(i, (e.target as HTMLSelectElement).value as Link['type'])}
          >
            {#each linkTypes as t}
              <option value={t}>{linkIcon[t]} {t}</option>
            {/each}
          </select>
          <button
            type="button"
            class="text-red-400/60 hover:text-red-400 text-sm shrink-0 ml-auto"
            title="Remove link"
            onclick={() => remove(i)}
          >
            ×
          </button>
        </div>
        <input
          type="text"
          class="edit-input w-full text-xs"
          value={link.label}
          placeholder="Label"
          oninput={(e) => updateLabel(i, (e.target as HTMLInputElement).value)}
        />
        <input
          type="url"
          class="edit-input w-full text-xs"
          value={link.url}
          placeholder="https://..."
          oninput={(e) => updateUrl(i, (e.target as HTMLInputElement).value)}
        />
      </div>
    {/each}
    <button
      type="button"
      class="text-xs text-[#f39c12]/70 hover:text-[#f39c12]"
      onclick={add}
    >
      + Add link
    </button>
  </div>
{/if}
