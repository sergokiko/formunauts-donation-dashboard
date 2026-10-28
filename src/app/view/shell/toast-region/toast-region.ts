import { Component, computed, inject } from '@angular/core';
import { ToastService } from '../toast-service';

/**
 * Two always-present live regions (polite for successes, assertive for
 * errors) so assistive tech announces toasts the moment they are inserted.
 */
@Component({
  selector: 'app-toast-region',
  templateUrl: './toast-region.html',
  styleUrl: './toast-region.scss'
})
export class ToastRegion {
  protected readonly toasts = inject(ToastService);
  protected readonly successes = computed(() => this.toasts.toasts().filter((t) => t.kind === 'success'));
  protected readonly errors = computed(() => this.toasts.toasts().filter((t) => t.kind === 'error'));
}
