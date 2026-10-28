import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MockApiPanel } from './view/shell/mock-api-panel/mock-api-panel';
import { ToastRegion } from './view/shell/toast-region/toast-region';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastRegion, MockApiPanel],
  template: `
    <router-outlet />
    <app-toast-region />
    <app-mock-api-panel />
  `
})
export class App {}
