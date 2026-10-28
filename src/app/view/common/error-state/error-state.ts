import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss'
})
export class ErrorState {
  readonly title = input.required<string>();
  readonly message = input<string | null | undefined>();
  readonly canRetry = input(true);
  readonly retry = output<void>();
}
