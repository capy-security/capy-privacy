import { writable } from 'svelte/store';

// Store to manage sidebar toggle function
export const sidebarToggleStore = writable<(() => void) | null>(null);

