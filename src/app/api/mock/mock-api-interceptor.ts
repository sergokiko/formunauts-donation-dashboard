import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, throwError, timer } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { MockApiControls } from './mock-api-controls';
import { MockApiServer } from './mock-api-server';

/** Simulated network delay for every mocked call. */
const LATENCY_MS = 350;

/**
 * Routes `/api/**` to the in-browser mock server after a short simulated delay.
 * Remove this interceptor from `app.config.ts` to talk to a real backend —
 * the API services do not know the difference.
 */
export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(`${API_BASE_URL}/`)) {
    return next(request);
  }
  const server = inject(MockApiServer);
  const controls = inject(MockApiControls);

  return timer(LATENCY_MS).pipe(
    switchMap(() =>
      controls.consumeFailNext()
        ? throwError(
            () =>
              new HttpErrorResponse({
                status: 500,
                statusText: 'INTERNAL',
                url: request.url,
                error: { code: 'INTERNAL', message: 'Simulated outage (triggered from the Mock API panel).' }
              })
          )
        : server.handle(request)
    )
  );
};
