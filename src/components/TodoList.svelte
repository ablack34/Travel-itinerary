<script lang="ts">
  import type { TodoItem } from '../lib/types';
  import { loadTodos, saveTodos } from '../lib/api';

  interface Props {
    travelers: string[];
  }

  let { travelers }: Props = $props();

  let todos = $state<TodoItem[]>([]);
  let loaded = $state(false);
  let editingId = $state<string | null>(null);
  let collapsed = $state(false);

  const doneCount = $derived(todos.filter((t) => t.done).length);

  $effect(() => {
    loadTodos().then((data) => {
      todos = data;
      loaded = true;
    });
  });

  async function save() {
    await saveTodos(todos);
  }

  function stopEditing(e?: FocusEvent) {
    if (e) {
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest('.todo-edit-row')) return;
    }
    editingId = null;
    save();
  }

  function toggle(index: number) {
    todos[index].done = !todos[index].done;
    save();
  }

  function updateText(index: number, text: string) {
    todos[index].text = text;
  }

  function updateAssignee(index: number, assignee: string) {
    todos[index].assignee = assignee;
  }

  function remove(index: number) {
    todos.splice(index, 1);
    save();
  }

  function add() {
    const id = crypto.randomUUID();
    todos.push({
      id,
      text: '',
      done: false,
      assignee: travelers[0] ?? '',
    });
    editingId = id;
  }
</script>

<section class="todo-section max-w-[1400px] mx-auto mb-8">
  <button
    type="button"
    class="w-full flex items-center justify-between px-5 py-4 bg-white/5 rounded-2xl hover:bg-white/[0.07] transition-colors cursor-pointer"
    onclick={() => (collapsed = !collapsed)}
  >
    <h2 class="text-xl font-bold text-[#f39c12] flex items-center gap-2">
      📋 Research To-Do List
      <span class="text-sm font-normal text-[#aaa]">
        ({doneCount}/{todos.length} done)
      </span>
    </h2>
    <span class="text-[#aaa] text-lg transition-transform" class:rotate-180={!collapsed}>
      ▾
    </span>
  </button>

  {#if !collapsed}
    <div class="bg-white/5 rounded-b-2xl -mt-2 pt-4 px-5 pb-5">
      {#if todos.length === 0}
        <p class="text-[#666] text-sm italic">No tasks yet — click "+ Add task" below to get started!</p>
      {:else}
        <ul class="space-y-2">
          {#each todos as todo, i}
            <li class="flex items-center gap-3 group todo-edit-row">
              <button
                type="button"
                class="shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors {todo.done ? 'border-[#f39c12] bg-[#f39c12]/20' : 'border-white/20'}"
                onclick={() => toggle(i)}
                title={todo.done ? 'Mark incomplete' : 'Mark complete'}
              >
                {#if todo.done}
                  <span class="text-[#f39c12] text-xs">✓</span>
                {/if}
              </button>

              {#if editingId === todo.id}
                <!-- svelte-ignore a11y_autofocus -->
                <input
                  type="text"
                  class="edit-input flex-1 text-sm"
                  value={todo.text}
                  placeholder="What needs researching..."
                  oninput={(e) => updateText(i, (e.target as HTMLInputElement).value)}
                  onblur={(e) => stopEditing(e)}
                  onkeydown={(e) => { if (e.key === 'Enter') stopEditing(); }}
                  autofocus
                />
                <select
                  class="edit-select text-xs"
                  value={todo.assignee}
                  onchange={(e) => updateAssignee(i, (e.target as HTMLSelectElement).value)}
                  onblur={(e) => stopEditing(e)}
                >
                  {#each travelers as t}
                    <option value={t}>{t}</option>
                  {/each}
                </select>
                <button
                  type="button"
                  class="text-red-400/60 hover:text-red-400 text-sm shrink-0"
                  title="Remove"
                  onclick={() => remove(i)}
                >
                  ×
                </button>
              {:else}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <span
                  class="flex-1 text-sm cursor-pointer"
                  class:line-through={todo.done}
                  class:text-[#666]={todo.done}
                  class:text-[#ccc]={!todo.done}
                  onclick={() => (editingId = todo.id)}
                  title="Click to edit"
                >
                  {todo.text}
                </span>
                {#if todo.assignee}
                  <span class="text-xs bg-white/10 text-[#aaa] px-2 py-0.5 rounded-full">
                    {todo.assignee}
                  </span>
                {/if}
                <button
                  type="button"
                  class="text-red-400/60 opacity-0 group-hover:opacity-100 hover:text-red-400 text-sm shrink-0 transition-opacity"
                  title="Remove"
                  onclick={() => remove(i)}
                >
                  ×
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}

      <button
        type="button"
        class="mt-3 text-xs text-[#f39c12]/70 hover:text-[#f39c12] transition-colors"
        onclick={add}
      >
        + Add task
      </button>
    </div>
  {/if}
</section>
