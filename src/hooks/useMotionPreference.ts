import { useSyncExternalStore } from 'react';

export type MotionMode = 'full' | 'reduced';

const listeners = new Set<() => void>();

// The initial value is set by the inline script in index.html before first paint:
// full motion, unless the OS asks for reduced motion.
function readMode(): MotionMode {
  return document.documentElement.dataset.motion === 'reduced' ? 'reduced' : 'full';
}

// Follow OS changes live.
window
  .matchMedia('(prefers-reduced-motion: reduce)')
  .addEventListener('change', (event) => {
    document.documentElement.dataset.motion = event.matches ? 'reduced' : 'full';
    listeners.forEach((notify) => notify());
  });

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function useMotionPreference() {
  const mode = useSyncExternalStore(subscribe, readMode, (): MotionMode => 'full');
  return { mode, reduced: mode === 'reduced' };
}
