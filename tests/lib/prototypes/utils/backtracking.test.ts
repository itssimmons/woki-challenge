import backtrack from '@lib/utils/backtracking';

describe('backtracking tests', () => {
  it('Should find all combinations that sum up to target value', () => {
    const items = [1, 2, 3, 4, 5, 6, 7];

    const TARGET = 12;

    const candidates = backtrack(
      items,
      function reject(path) {
        const sum = path.reduce((prev, next) => prev + next, 0);
        return sum > TARGET;
      },
      function accept(path) {
        const sum = path.reduce((prev, next) => prev + next, 0);
        return sum >= TARGET;
      }
    );

    for (const candidate of candidates) {
      const sum = candidate.reduce((prev, next) => prev + next, 0);
      expect(sum).toBeGreaterThanOrEqual(TARGET);
    }

    expect(candidates).toHaveLength(8);
    expect(candidates).toEqual(
      expect.arrayContaining([
        [1, 2, 3, 6],
        [1, 2, 4, 5],
        [1, 4, 7],
        [1, 5, 6],
        [2, 3, 7],
        [2, 4, 6],
        [3, 4, 5],
        [5, 7],
      ])
    );
  });
});
