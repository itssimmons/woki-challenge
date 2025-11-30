import { rank } from "@domain/wokibrain";

const PERFECT_SCORE = 10.0;
const UNMATCH_SCORE = 0.0;

describe("Wokibrain ranking tests", () => {
  it("Should at least 1 perfect match", () => {
    const candidates: Gap[] = [
      {
        minSize: 2,
        maxSize: 4,
        kind: "single",
        tableIds: ["T1"],
        startDate: "",
        endDate: "",
      },
      {
        minSize: 4,
        maxSize: 6,
        kind: "combo",
        tableIds: ["T2", "T3"],
        startDate: "",
        endDate: "",
      },
      {
        minSize: 5,
        maxSize: 8,
        kind: "single",
        tableIds: ["T4"],
        startDate: "",
        endDate: "",
      },
    ];

    const capacity = 4;
    const scoredCandidates = rank(candidates, capacity);
    expect(scoredCandidates[0].score).toBeGreaterThanOrEqual(PERFECT_SCORE);
  });

  it("Should ranks be sorted ASC", () => {
    const candidates: Gap[] = [
      {
        minSize: 4,
        maxSize: 6,
        kind: "combo",
        tableIds: ["T2", "T3"],
        startDate: "",
        endDate: "",
      }, // 1
      {
        minSize: 5,
        maxSize: 8,
        kind: "single",
        tableIds: ["T4"],
        startDate: "",
        endDate: "",
      }, // 2
      {
        minSize: 2,
        maxSize: 4,
        kind: "single",
        tableIds: ["T1"],
        startDate: "",
        endDate: "",
      }, // 0
    ];

    const capacity = 4;
    const scoredCandidates = rank(candidates, capacity);

    for (let i = 1; i < scoredCandidates.length; i++) {
      const curr = scoredCandidates[i];
      const next = scoredCandidates[i + 1];
      const prev = scoredCandidates[i - 1];

      if (i !== scoredCandidates.length - 1) {
        expect(curr.score).toBeGreaterThanOrEqual(next.score);
      } else {
        // Last item, only compare with previous
        expect(curr.score).toBeLessThanOrEqual(prev.score);
      }
    }
  });

  it("Should penalize all candidates due to the small capacity", () => {
    const candidates: Gap[] = [
      {
        minSize: 2,
        maxSize: 2,
        kind: "single",
        tableIds: ["T1"],
        startDate: "",
        endDate: "",
      },
      {
        minSize: 2,
        maxSize: 4,
        kind: "combo",
        tableIds: ["T2", "T3"],
        startDate: "",
        endDate: "",
      },
      {
        minSize: 2,
        maxSize: 4,
        kind: "single",
        tableIds: ["T4"],
        startDate: "",
        endDate: "",
      },
    ];

    const capacity = 6;
    const scoredCandidates = rank(candidates, capacity);

    for (const candidate of scoredCandidates) {
      expect(candidate.score).toEqual(UNMATCH_SCORE);
    }
  });
});
