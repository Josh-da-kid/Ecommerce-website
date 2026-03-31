import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  return {
    subscribe,
    show(type: Toast['type'], message: string) {
      const id = Math.random().toString(36).slice(2);
      update(toasts => [...toasts, { id, type, message }]);
      setTimeout(() => {
        update(toasts => toasts.filter(t => t.id !== id));
      }, 5000);
    },
    dismiss(id: string) {
      update(toasts => toasts.filter(t => t.id !== id));
    }
  };
}

export const toasts = createToastStore();
