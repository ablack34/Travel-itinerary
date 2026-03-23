import type { Itinerary } from './types';
import seedData from './itinerary-seed.json';

const LOCAL_KEY = 'travel-itinerary-data';

export async function loadItinerary(): Promise<Itinerary> {
  let data: Itinerary | undefined;
  try {
    const res = await fetch('/api/itinerary');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      }
    }
    if (!data && res.status === 404) {
      const seed = seedData as Itinerary;
      await saveItinerary(seed);
      data = seed;
    }
  } catch {
    // API unreachable — try localStorage, then seed
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) {
      try { data = JSON.parse(stored); } catch { /* ignore bad data */ }
    }
  }
  if (!data) data = seedData as Itinerary;
  if (!data.todos) data.todos = [];
  return data;
}

export async function saveItinerary(itinerary: Itinerary): Promise<void> {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(itinerary));
  try {
    const res = await fetch('/api/itinerary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itinerary),
    });
    if (!res.ok) {
      console.warn('Failed to save itinerary — API may not be available');
    }
  } catch {
    console.warn('Save skipped — API not reachable (saved to localStorage)');
  }
}

// ---- Attachment APIs ----

export interface AttachmentFile {
  name: string;
  fullPath: string;
  size: number;
  type: string;
  url: string;
}

export async function listFiles(dayKey: string): Promise<AttachmentFile[]> {
  try {
    const res = await fetch(`/api/list-files?day=${encodeURIComponent(dayKey)}`);
    if (res.ok) {
      const data = await res.json();
      return data.files || [];
    }
  } catch {
    // API not available
  }
  return [];
}

export async function uploadFile(dayKey: string, file: File): Promise<void> {
  const res = await fetch('/api/get-upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day: dayKey, fileName: file.name }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.uploadUrl) {
    throw new Error(data?.error || 'Upload API not available — requires SWA backend');
  }

  const uploadRes = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });
  if (!uploadRes.ok) throw new Error('Upload failed');
}

export async function deleteFile(blobPath: string): Promise<void> {
  await fetch('/api/delete-file', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blobPath }),
  });
}
