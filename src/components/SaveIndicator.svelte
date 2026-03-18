<script lang="ts">
  interface Props {
    status: 'idle' | 'saving' | 'saved' | 'error';
  }

  let { status }: Props = $props();
</script>

{#if status !== 'idle'}
  <span class="inline-flex items-center gap-1 text-sm ml-4">
    {#if status === 'saving'}
      <span class="animate-pulse text-[#f39c12]">💾 Saving...</span>
    {:else if status === 'saved'}
      <span class="text-green-400">✓ Saved</span>
    {:else if status === 'error'}
      <span class="text-red-400">✗ Save failed</span>
    {/if}
  </span>
{/if}
