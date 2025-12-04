import { discover } from "@domain/gaps";
import sqlite from "@database/driver/sqlite";

jest.mock("@database/driver/sqlite", () => ({
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
  
 	it('Should offer multiple combination of tables', () => {
		(sqlite.prepare as jest.Mock).mockReturnValue({
			all: () => [
				{ id: 'T1', sector_id: 'S1', min_size: 1, max_size: 1 },
				{ id: 'T2', sector_id: 'S1', min_size: 1, max_size: 1 },
				{ id: 'T3', sector_id: 'S1', min_size: 1, max_size: 1 },
				{ id: 'T4', sector_id: 'S1', min_size: 1, max_size: 1 },
				{ id: 'T5', sector_id: 'S1', min_size: 1, max_size: 1 },
				{ id: 'T6', sector_id: 'S1', min_size: 1, max_size: 1 },
				{ id: 'T7', sector_id: 'S1', min_size: 1, max_size: 1 },
				{ id: 'T8', sector_id: 'S1', min_size: 1, max_size: 1 },
				{ id: 'T9', sector_id: 'S1', min_size: 1, max_size: 1 },
				{ id: 'T10', sector_id: 'S1', min_size: 1, max_size: 1 },
			],
		});
 
		const settings = {
			restaurantId: 'R1',
			sectorId: 'S1',
			partySize: 10,
			startDate: '2024-07-10T13:00:00Z',
			endDate: '2024-07-10T14:00:00Z',
		};
 
		const availableTables = discover(settings);
		expect(availableTables.length).toBe(1);
		expect(availableTables[0].kind).toBe('combo');
		expect(availableTables[0].tableIds.length).toBe(10);
		expect(availableTables[0].maxSize).toBe(10);
		expect(availableTables[0].tableIds).toEqual(expect.arrayContaining([
			'T1', 'T2', 'T3', 'T4', 'T5',
			'T6', 'T7', 'T8', 'T9', 'T10',
		]));
	});
});
