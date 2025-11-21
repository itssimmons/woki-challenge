import sqlite from "@database/driver/sqlite";
import backtrack from "@lib/utils/backtracking";

const TABLE_COMBO_LIMIT = 2;

interface DiscoverSettings {
  restaurantId: ID;
  sectorId: ID;
  partySize: number;
  startDate: Timestamp;
  endDate: Timestamp;
}

type AuxGap = Extend<Edit<Gap, "kind", string>, { sectorId: ID }>;

/**
 * Determines all viable seating options within a given sector and time window.
 *
 * The procedure unfolds in several stages:
 *
 * 1. Retrieve every table in the target sector that is free during the specified interval.
 * 2. Divide these tables into two groups:
 *    - **Full** tables, which by themselves satisfy the required party size.
 *    - **Partial** tables, which may contribute to a combined arrangement.
 * 3. Employ a backtracking strategy to assemble every valid combination of partial tables
 *    whose total capacity meets the party’s needs.
 * 4. Produce a consolidated list containing both individual full tables and all
 *    qualifying table combinations.
 *
 * @param settings Configuration governing the search for suitable table gaps.
 * @returns A collection of seating options, each representing either a single table
 * or a valid combination that accommodates the party size.
 */
export function discover({
  restaurantId,
  sectorId,
  startDate,
  endDate,
  ...args
}: DiscoverSettings): Gap[] {
  const stmt = sqlite.prepare(/*sql*/ `
		SELECT t.*
		FROM tables t
		INNER JOIN sectors s ON t.sector_id = s.id
		WHERE
			s.restaurant_id = :restaurantId
			AND t.sector_id = :sectorId
			AND NOT EXISTS (
				SELECT 1
				FROM booked_tables bt
				JOIN bookings b ON bt.booking_id = b.id
				WHERE
    			bt.table_id = t.id
       		AND b.status = 'CONFIRMED'
					AND NOT (
						b.end < datetime(:startDate) OR
						b.start >= datetime(:endDate)
					)
			)
	`);

  const tables = stmt.all({
    restaurantId,
    sectorId,
    startDate,
    endDate,
  }) as unknown as Table[];

  const singles: AuxGap[] = tables.map((table) => ({
    kind: "single",
    tableIds: [table.id],
    sectorId: table.sector_id,
    maxSize: table.max_size,
    minSize: table.min_size,
  }));

  const full = [];
  const partial = [];

  for (const s of singles) {
    if (args.partySize <= s.maxSize && args.partySize >= s.minSize) {
      full.push(s);
    } else {
      partial.push(s);
    }
  }

  const combos = backtrack(
    partial,
    function reject(path) {
      if (path.length > TABLE_COMBO_LIMIT) return true;

      // avoid duplicates (e.g: [T1, T1])
      const ids = path.map((g) => g.tableIds).flat();
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) return true;

      // avoid backwards combos (e.g: [T1, T2] and [T2, T1])
      for (let i = 1; i < ids.length; i++) {
        if (ids[i] <= ids[i - 1]) return true;
      }

      return false;
    },
    function accept(path) {
      if (path.length === 0) return false;

      const maxTotal = path.reduce((sum, g) => sum + g.maxSize, 0);
      const minTotal = path.reduce((sum, g) => sum + g.minSize, 0);

      if (args.partySize < minTotal) return false;
      return args.partySize <= maxTotal;
    },
  );

  // I don't think O(n^2) is a bad idea due to the small number of tables per sector
  // Either way, I'm gonna use a backtracking algorithm to find all combos
  // So it is possible to increase the max number of tables in a combo in the future
  // My real concern are duplicate combos (e.g: [T1, T2] and [T2, T1] or [T1, T1])
  return [
    ...full,
    ...combos.map((combo) => ({
      kind: "combo",
      tableIds: combo.map((g) => g.tableIds).flat(),
      sectorId: combo[0].sectorId,
      maxSize: combo.reduce((sum, g) => sum + g.maxSize, 0),
      minSize: combo.reduce((sum, g) => sum + g.minSize, 0),
    })),
  ] as Gap[];
}
