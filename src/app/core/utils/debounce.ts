export interface DebouncedFn<A extends unknown[]> {
  (...args: A): void;
  cancel(): void;
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, waitMs: number): DebouncedFn<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  }) as DebouncedFn<A>;

  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
