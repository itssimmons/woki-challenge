import dayjs from '@lib/addons/dayjs';

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
    {
      tz = 'UTC',
      ...options
    }: {
      include: Tuple<[dayjs.Dayjs, dayjs.Dayjs]>;
      exclude?: Array<Tuple<[dayjs.Dayjs, dayjs.Dayjs]>>;
      tz?: string;
    }
  ): Array<Tuple<[ISOTimeStamp, ISOTimeStamp]>> {
    const [start, end] = options.include;

    const s: ReturnType<typeof slots> = [];
    let current = start.clone();

    while (true) {
      const slotStart = current.clone();
      const slotEnd = current.add(of, 'minute');
      let skip = false;

      if (options.exclude) {
        for (const [exStart, exEnd] of options.exclude) {
          if (slotStart.isBefore(exEnd) && slotEnd.isAfter(exStart)) {
            current = exEnd.clone();
            skip = true;
            break;
          }
        }
      }

      if (skip) continue;
      if (slotEnd.isAfter(end)) break;

      s.push([slotStart.tz(tz).format(), slotEnd.tz(tz).format()]);
      current = slotEnd;
    }
    return s;
  }

  export function replaceTime(
    base: dayjs.Dayjs,
    time: Clock.Time,
    tz: string = 'UTC'
  ): dayjs.Dayjs {
    const [hours, minutes] = time.split(':').map(Number);
    return base
      .clone()
      .tz(tz, true)
      .hour(hours)
      .minute(minutes)
      .second(0)
      .millisecond(0);
  }

  export function offset(iana: string) {
    return dayjs().tz(iana).format('Z');
  }

  export function slotDiff(
    slots: Array<Tuple<[Clock.Time, Clock.Time]>>
  ): Array<Tuple<[Clock.Time | null, Clock.Time | null]>> {
    if (slots.length === 0) return [[null, null]];

    const diffs: Array<[Clock.Time | null, Clock.Time | null]> = Array.from(
      { length: slots.length + 1 },
      () => [null, null]
    );

    diffs[0][1] = slots[0][0] as Clock.Time;
    diffs[diffs.length - 1][0] = slots[slots.length - 1][1] as Clock.Time;

    for (let i = 1; i < slots.length; ++i) {
      const prevWindow = slots[i - 1];
      const currWindow = slots[i];

      if (prevWindow) diffs[i][0] = prevWindow[1] as Clock.Time;
      if (currWindow) diffs[i][1] = currWindow[0] as Clock.Time;
    }

    return diffs;
  }
}

export default Clock;
