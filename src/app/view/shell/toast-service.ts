import { Service, signal } from '@angular/core';

export type ToastKind = 'success' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const AUTO_DISMISS_MS = 6000;

/** App-wide notifications. Successes fade out on their own; errors stay until dismissed. */
@Service()
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(message: string) {
    const id = this.push('success', message);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }

  error(message: string) {
    this.push('error', message);
  }

  dismiss(id: number) {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private push(kind: ToastKind, message: string): number {
    const id = this.nextId++;
    this.toasts.update((toasts) => [...toasts, { id, kind, message }]);
    return id;
  }
}
