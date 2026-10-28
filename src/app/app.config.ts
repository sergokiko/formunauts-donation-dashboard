import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { mockApiInterceptor } from './api/mock/mock-api-interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Drop `mockApiInterceptor` to call a real REST backend at API_BASE_URL.
    provideHttpClient(withInterceptors([mockApiInterceptor]))
  ]
};
