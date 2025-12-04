export default function withDefault<T extends number | boolean | string>(
  base: T | Falsy,
  defaults: T
): T;
export default function withDefault<T extends number | boolean | string, K>(
  base: T | Falsy,
  defaults: T,
  transformer: (value: T) => K
): K;
/**
 * Returns the base value if it's truthy; otherwise, returns the default value.
 * If a transformer function is provided, it applies the transformer to the final value before returning it.
 * @param base - The base value which may be falsy.
 * @param defaults - The default value to use if the base is falsy.
 * @param transformer - An optional function to transform the final value.
 * @returns The base value, the default value, or the transformed value.
 */
export default function withDefault<T extends number | boolean | string, K>(
  base: T | Falsy,
  defaults: T,
  transformer?: (value: T) => K
): T | K {
  const finalValue = base || defaults;
  return transformer ? transformer(finalValue) : finalValue;
}
