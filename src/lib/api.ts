import type { Itinerary } from './types';
import seedData from './itinerary-seed.json';

export async function loadItinerary(): Promise<Itinerary> {
  try {
    const res = await fetch('/api/itinerary');
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return res.json();
      }
    }
    if (res.status === 404) {
      const seed = seedData as Itinerary;
      await saveItinerary(seed);
      return seed;
    }
  } catch {
    // API unreachable (e.g. standalone Vite dev) — use seed data
  }
  return seedData as Itinerary;
}

export async function saveItinerary(itinerary: Itinerary): Promise<void> {
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
    console.warn('Save skipped — API not reachable');
  }
}
