import { afterNextRender, DestroyRef, ElementRef, inject, Signal, signal } from '@angular/core';

/**
 * Tracks the rendered width of a host element as a signal, so charts can
 * recompute their scales when the layout changes. Must be called from an
 * injection context (a field initializer). Falls back gracefully where
 * `ResizeObserver` is unavailable (jsdom).
 */
export function elementWidth(host: ElementRef<HTMLElement>, fallback = 640): Signal<number> {
  const width = signal(fallback);
  const destroyRef = inject(DestroyRef);

  afterNextRender(() => {
    const element = host.nativeElement;
    const measured = Math.round(element.getBoundingClientRect().width);
    if (measured > 0) {
      width.set(measured);
    }
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? 0);
      if (next > 0) {
        width.set(next);
      }
    });
    observer.observe(element);
    destroyRef.onDestroy(() => observer.disconnect());
  });

  return width.asReadonly();
}
