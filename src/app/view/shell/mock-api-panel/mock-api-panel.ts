import { Component, inject } from '@angular/core';
import { MockApiControls } from '../../../api/mock/mock-api-controls';

/** Small disclosure in the corner that lets reviewers simulate a failing request. */
@Component({
  selector: 'app-mock-api-panel',
  templateUrl: './mock-api-panel.html',
  styleUrl: './mock-api-panel.scss'
})
export class MockApiPanel {
  protected readonly controls = inject(MockApiControls);

  onFailNext(event: Event) {
    this.controls.failNext.set((event.target as HTMLInputElement).checked);
  }
}
