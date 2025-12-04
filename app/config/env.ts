export default function env(key: string): unknown;
export default function env<T>(key: string, defaultValue: T): T;
export default function env<T>(key: string, defaultValue?: T): T | undefined {
  const value = process.env[key];
  if (value !== undefined) return value as unknown as T;
  return defaultValue;
}
