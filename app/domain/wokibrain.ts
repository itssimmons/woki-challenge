export type ScoredGap = Join<Gap, { score: number }>;

/**
 * Ranks the provided gaps based on how well they fit the given capacity.
 *
 * The ranking algorithm considers factors such as:
 * - The difference between the gap's capacity and the required capacity.
 * - Preference for gaps that closely match the required capacity without excessive surplus.
 *
 * @example
 * const gaps: Gap[] = [
 * 	{ minSize: 2, maxSize: 4, kind: "single", tableIds: ["T1"] },
 * 	{ minSize: 4, maxSize: 6, kind: "combo", tableIds: ["T1", "T2"] },
 * 	{ minSize: 3, maxSize: 3, kind: "combo", tableIds: ["T3", "T4"] },
 * ];
 *
 * rank(gaps, 4);
 * [
 *   { score: 10.0, minSize: 2, maxSize: 4, kind: "single", ... },
 *   { score: 8.0, minSize: 4, maxSize: 6, kind: "combo", ... },
 *   { score: 0.0, minSize: 3, maxSize: 3, kind: "combo", ... },
 * ];
 *
 * @param gaps An array of Gap objects to be ranked.
 * @param capacity The required capacity to accommodate.
 * @returns An array of ScoredGap objects, each with an added score property in a scale from 0.0 to 10.0.
 */
export function rank(gaps: Gap[], capacity: number): ScoredGap[] {
  const rankedGaps: ScoredGap[] = [...(gaps as ScoredGap[])];
  for (const g of rankedGaps) {
    const sizeDiff = g.maxSize - capacity;
    let score = 0.0;

    if (sizeDiff >= 0) {
      // Favor gaps that fit the capacity closely without exceeding it too much
      score += 10.0 - sizeDiff;
    } else {
      // Penalize gaps that are too small
      score += sizeDiff;
    }

    g.score = Math.max(0.0, Math.min(10.0, score));
  }

  rankedGaps.sort((a, b) => b.score - a.score);
  return rankedGaps as ScoredGap[];
}
