import { discover } from "./gaps";
import sqlite from "../database/db";

jest.mock("../database/db", () => ({
  __esModule: true,
  default: {
    prepare: jest.fn(),
  },
}));

describe("Gaps discovery tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // normal booking
  it("Should find available tables", () => {
    (sqlite.prepare as jest.Mock).mockReturnValue({
      all: () => [
        { id: "T1", sector_id: "S1", min_size: 2, max_size: 2 },
        { id: "T2", sector_id: "S1", min_size: 2, max_size: 2 },
      ],
    });

    const settings = {
      restaurantId: "R1",
      sectorId: "S1",
      partySize: 2,
      startDate: "2024-07-10T13:00:00Z",
      endDate: "2024-07-10T14:00:00Z",
    };

    const availableTables = discover(settings);
    expect(availableTables.length).toBeGreaterThan(0);
  });

  // offering a combo table
  it("Should offer at least 1 combo (e.g: [T3, T1+T2])", () => {
    (sqlite.prepare as jest.Mock).mockReturnValue({
      all: () => [
        { id: "T1", sector_id: "S1", min_size: 2, max_size: 2 },
        { id: "T2", sector_id: "S1", min_size: 2, max_size: 4 },
        { id: "T3", sector_id: "S1", min_size: 5, max_size: 5 },
      ],
    });

    const settings = {
      restaurantId: "R1",
      sectorId: "S1",
      partySize: 5,
      startDate: "2024-07-10T13:00:00Z",
      endDate: "2024-07-10T14:00:00Z",
    };

    const availableTables = discover(settings);
    const hasCombo = availableTables.some((table) => table.kind === "combo");
    expect(hasCombo).toBe(true);
  });

  // overlap at start booking
  it("Should failed due to an overlap booking", () => {
    (sqlite.prepare as jest.Mock).mockReturnValue({
      all: () => [],
    });

    const settings = {
      restaurantId: "R1",
      sectorId: "S1",
      partySize: 8,
      startDate: "2024-07-10T13:00:00Z",
      endDate: "2024-07-10T14:00:00Z",
    };

    const availableTables = discover(settings);
    expect(availableTables.length).toBe(0);
  });
});
