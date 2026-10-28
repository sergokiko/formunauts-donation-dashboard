import { Service, signal } from '@angular/core';

/** Knob for the in-browser mock backend, exposed by the dev panel to demo the error paths. */
@Service()
export class MockApiControls {
  readonly failNext = signal(false);

  /** Reads and clears the one-shot failure flag. */
  consumeFailNext(): boolean {
    const shouldFail = this.failNext();
    if (shouldFail) {
      this.failNext.set(false);
    }
    return shouldFail;
  }
}
