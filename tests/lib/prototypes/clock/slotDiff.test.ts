import Clock from '@lib/prototypes/clock';

describe('Clock.slotDiff tests', () => {
  it('Should returns a slot difference of size 4, 1 hour range each', () => {
    const diff = Clock.slotDiff([
      ['09:00', '12:00'],
      ['13:00', '15:00'],
      ['16:00', '19:00'],
    ]);

    expect(diff).toHaveLength(4);
    expect(diff).toEqual([
      [null, '09:00'],
      ['12:00', '13:00'],
      ['15:00', '16:00'],
      ['19:00', null],
    ]);
  });

  it('Should calculate around 100 slot diffs, 5 min each', () => {
    const slots: Array<Tuple<[Clock.Time, Clock.Time]>> = [];

    let hour = 8;
    let minute = 0;

    for (let i = 0; i < 100; i++) {
      const startHour = hour;
      const startMinute = minute;

      // end = start + 5
      let endHour = hour;
      let endMinute = minute + 5;

      if (endMinute >= 60) {
        endHour += Math.floor(endMinute / 60);
        endMinute = endMinute % 60;
      }

      const start = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
      const end = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

      slots.push([start as Clock.Time, end as Clock.Time]);

      // jump forward: start = end + 5
      minute = endMinute + 5;
      hour = endHour;

      if (minute >= 60) {
        hour += Math.floor(minute / 60);
        minute = minute % 60;
      }
    }

    const diff = Clock.slotDiff(slots);

    expect(diff).toHaveLength(101);
    expect(diff[0]).toEqual([null, '08:00']);
    expect(diff[25]).toEqual(['12:05', '12:10']);
    expect(diff[50]).toEqual(['16:15', '16:20']);
    expect(diff[75]).toEqual(['20:25', '20:30']);
    expect(diff[100]).toEqual(['24:35', null]);
  });

  it('Should handle empty slots array', () => {
    const diff = Clock.slotDiff([]);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual([null, null]);
  });
});
