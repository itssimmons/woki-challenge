import dayjs from "@lib/addons/dayjs";

namespace Clock {
  // 00 - 23
  export type Hours = `0${Digit}` | `1${Digit}` | `2${0 | 1 | 2 | 3}`;
  // 00 - 59
  export type Minutes =
    | `0${Digit}`
    | `1${Digit}`
    | `2${Digit}`
    | `3${Digit}`
    | `4${Digit}`
    | `5${Digit}`;

  export type Time = `${Hours}:${Minutes}`;

  /**
   * Splits a time window into slots of given duration
   *
   * @param of value in minutes of each slot
   * @param options object with include and optional exclude date tuples
   * - include: Tuple with start and end `Dayjs` objects representing the time window to split
   * - exclude: Array of Tuples with start and end times (HH:mm) to exclude from the slots
   * @returns array of date tuples representing the slots
   */
  export function slots(
    of: number,
    options: {
      include: Tuple<[dayjs.Dayjs, dayjs.Dayjs]>;
      exclude?: Array<Tuple<[Clock.Time, Clock.Time]>>;
    },
  ): Array<Tuple<[dayjs.Dayjs, dayjs.Dayjs]>> {
    const [start, end] = options.include;

    let prev = start.clone();
    let next = start.clone();

    const s: ReturnType<typeof slots> = [];

    while (true) {
      const slotStart = prev.clone();
      const slotEnd = next.add(of, "minute");

      if (options.exclude) {
        const exclude = options.exclude.some(([exStartTime, exEndTime]) => {
          const exStart = Clock.replaceTime(slotStart, exStartTime);
          const exEnd = Clock.replaceTime(slotEnd, exEndTime);
          return slotStart.isBefore(exEnd) && slotEnd.isAfter(exStart);
        });

        if (exclude) {
          prev = slotEnd;
          next = slotEnd;
          continue;
        }
      }

      if (slotEnd > end) break;

      s.push([slotStart, slotEnd]);

      prev = slotEnd;
      next = slotEnd;
    }
    return s;
  }

  export function replaceTime(
    base: dayjs.Dayjs,
    time: Clock.Time,
  ): dayjs.Dayjs {
    const [hours, minutes] = time.split(":").map(Number);
    return dayjs.utc(base).hour(hours).minute(minutes).second(0).millisecond(0);
  }
}

export default Clock;
