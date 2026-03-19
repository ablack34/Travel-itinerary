<script lang="ts">
  import { listFiles, uploadFile, deleteFile, type AttachmentFile } from '../lib/api';

  interface Props {
    dayKey: string;
    dayLabel: string;
    onclose: () => void;
    oncountchange: (dayKey: string, count: number) => void;
  }

  let { dayKey, dayLabel, onclose, oncountchange }: Props = $props();

  let files = $state<AttachmentFile[]>([]);
  let loading = $state(true);
  let uploading = $state(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  $effect(() => {
    loadFiles();
  });

  async function loadFiles() {
    loading = true;
    files = await listFiles(dayKey);
    loading = false;
    oncountchange(dayKey, files.length);
  }

  function fileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return '📄';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['eml', 'msg'].includes(ext)) return '📧';
    if (['doc', 'docx'].includes(ext)) return '📝';
    return '📎';
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    uploading = true;
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} is too large (max 10MB).`);
        continue;
      }
      try {
        await uploadFile(dayKey, file);
      } catch (e) {
        alert(`Failed to upload ${file.name}: ${(e as Error).message}`);
      }
    }
    uploading = false;
    await loadFiles();
  }

  async function handleDelete(file: AttachmentFile) {
    await deleteFile(file.fullPath);
    await loadFiles();
  }

  let dragOver = $state(false);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    handleFiles(e.dataTransfer?.files ?? null);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }

  function onDragLeave() {
    dragOver = false;
  }

  let fileInputEl: HTMLInputElement | undefined = $state();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
  onkeydown={(e) => e.key === 'Escape' && onclose()}
  onclick={onclose}
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="attach-modal"
    onclick={(e) => e.stopPropagation()}
  >
    <button class="absolute top-4 right-4 text-[#aaa] hover:text-white text-xl cursor-pointer" onclick={onclose}>
      &times;
    </button>

    <h3 class="text-lg font-bold text-[#f39c12] mb-4">📎 {dayLabel}</h3>

    <!-- Drop zone -->
    <div
      class="attach-dropzone"
      class:dragover={dragOver}
      ondrop={onDrop}
      ondragover={onDragOver}
      ondragleave={onDragLeave}
      onclick={() => fileInputEl?.click()}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && fileInputEl?.click()}
    >
      {#if uploading}
        <p class="animate-pulse">⬆️ Uploading...</p>
      {:else}
        <p>📁 Drop files here or click to browse</p>
        <p class="text-xs mt-1 text-[#666]">PDFs, images, emails — max 10MB each</p>
      {/if}
      <input
        bind:this={fileInputEl}
        type="file"
        multiple
        class="hidden"
        onchange={(e) => {
          handleFiles((e.target as HTMLInputElement).files);
          (e.target as HTMLInputElement).value = '';
        }}
      />
    </div>

    <!-- File list -->
    {#if loading}
      <p class="text-center text-[#666] text-sm py-4">Loading...</p>
    {:else if files.length === 0}
      <p class="text-center text-[#666] text-sm py-4">No attachments yet</p>
    {:else}
      <ul class="space-y-2 mt-3 max-h-[50vh] overflow-y-auto">
        {#each files as file}
          <li class="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <div class="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
              <span class="text-xl shrink-0">{fileIcon(file.name)}</span>
              <div class="min-w-0">
                <div class="text-sm truncate">{file.name}</div>
                <div class="text-xs text-[#888]">{formatSize(file.size)}</div>
              </div>
            </div>
            <div class="flex gap-2 shrink-0 ml-2">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                class="modal-action-btn"
              >
                Open
              </a>
              <button
                class="modal-action-btn delete"
                onclick={() => handleDelete(file)}
              >
                ✕
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
