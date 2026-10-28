import { DestroyRef, inject, Service, Signal, signal } from '@angular/core';

const MOBILE_QUERY = '(max-width: 1023px)';

/** Exposes the Mobile/Desktop breakpoint (same cut as the SCSS `for()` mixin) as a signal. */
@Service()
export class ViewportService {
  readonly isMobile: Signal<boolean> = this.track();

  private track(): Signal<boolean> {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return signal(false).asReadonly();
    }
    const query = window.matchMedia(MOBILE_QUERY);
    const isMobile = signal(query.matches);
    const update = (event: MediaQueryListEvent) => isMobile.set(event.matches);
    query.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', update));
    return isMobile.asReadonly();
  }
}
