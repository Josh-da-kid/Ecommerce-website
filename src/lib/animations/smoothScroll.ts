import Lenis from 'lenis';
import { browser } from '$app/environment';
import { onDestroy } from 'svelte';

let lenis: Lenis | null = null;

export function initSmoothScroll() {
  if (!browser) return;

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2
  });

  function raf(time: number) {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  return () => {
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollTo(target: string | number, offset: number = 0) {
  lenis?.scrollTo(target, { offset });
}
