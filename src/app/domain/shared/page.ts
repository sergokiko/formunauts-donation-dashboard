/** One slice of a cursor-paginated collection. `nextCursor` is `null` on the last page. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}
