export {};

declare global {
  interface Array<T> {
    sortBy(key: keyof T, dir?: "ASC" | "DESC"): T[];
    limit(count: number): T[];
  }
}

Array.prototype.sortBy = function <T, K extends keyof T>(
  this: T[],
  key: K,
  dir: "ASC" | "DESC" = "ASC",
): T[] {
  return this.sort((a, b) => {
    const first = a[key];
    const second = b[key];

    if (first === second) return 0;

    if (dir === "ASC") {
      return first < second ? -1 : 1;
    } else {
      return first > second ? -1 : 1;
    }
  });
};

Array.prototype.limit = function <T>(this: T[], count: number): T[] {
  return this.slice(0, count);
};
