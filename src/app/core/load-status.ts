/**
 * Lifecycle of an async piece of state. Uses the same words as Angular's
 * `ResourceStatus` so templates read the same whether the data comes from a
 * `resource()` or from a store.
 */
export type LoadStatus = 'idle' | 'loading' | 'resolved' | 'error';
