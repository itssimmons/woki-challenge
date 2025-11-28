import dayjs from "@lib/addons/dayjs";
import Clock from "@lib/prototypes/clock";

describe("Clock.slots tests", () => {
  it("Should return 3 slots of 60 minutes each", () => {
    const start = dayjs("2003-07-01T10:00:00.000Z");
    const end = dayjs("2003-07-01T13:00:00.000Z");

    const slots = Clock.slots(60, { include: [start, end] });

    expect(slots).toHaveLength(3);
    expect(slots).toEqual([
      [dayjs("2003-07-01T10:00:00.000Z"), dayjs("2003-07-01T11:00:00.000Z")],
      [dayjs("2003-07-01T11:00:00.000Z"), dayjs("2003-07-01T12:00:00.000Z")],
      [dayjs("2003-07-01T12:00:00.000Z"), dayjs("2003-07-01T13:00:00.000Z")],
    ]);
  });

  it("Should return 4 slots of 30 minutes each", () => {
    const start = dayjs("2002-10-18T10:00:00.000Z");
    const end = dayjs("2002-10-18T12:00:00.000Z");

    const slots = Clock.slots(30, { include: [start, end] });

    expect(slots).toHaveLength(4);
    expect(slots).toEqual([
      [dayjs("2002-10-18T10:00:00.000Z"), dayjs("2002-10-18T10:30:00.000Z")],
      [dayjs("2002-10-18T10:30:00.000Z"), dayjs("2002-10-18T11:00:00.000Z")],
      [dayjs("2002-10-18T11:00:00.000Z"), dayjs("2002-10-18T11:30:00.000Z")],
      [dayjs("2002-10-18T11:30:00.000Z"), dayjs("2002-10-18T12:00:00.000Z")],
    ]);
  });

  it("Shouldn't return any slots when duration exceeds window", () => {
    const start = dayjs("2020-01-01T08:00:00.000Z");
    const end = dayjs("2020-01-01T09:00:00.000Z");

    const slots = Clock.slots(120, { include: [start, end] });

    expect(slots).toHaveLength(0);
    expect(slots).toEqual([]);
  });

  it("Should return 2 slots using the exclude property", () => {
    const start = dayjs("2021-05-01T09:00:00.000Z");
    const end = dayjs("2021-05-01T12:00:00.000Z");

    const slots = Clock.slots(60, {
      include: [start, end],
      exclude: [["10:00", "11:00"]],
    });

    expect(slots).toHaveLength(2);
    expect(slots).toEqual([
      [dayjs("2021-05-01T09:00:00.000Z"), dayjs("2021-05-01T10:00:00.000Z")],
      [dayjs("2021-05-01T11:00:00.000Z"), dayjs("2021-05-01T12:00:00.000Z")],
    ]);
  });

  it("Shouldn't return any slots by excluding all the included", () => {
    const start = dayjs("2022-12-25T14:00:00.000Z");
    const end = dayjs("2022-12-25T16:00:00.000Z");

    const slots = Clock.slots(30, {
      include: [start, end],
      exclude: [["14:00", "16:00"]],
    });

    expect(slots).toHaveLength(0);
    expect(slots).toEqual([]);
  });

  it("Should return 4 slots separated with gaps of 60 minutes each, using the exclude property", () => {
    const start = dayjs("2023-03-10T08:00:00.000Z");
    const end = dayjs("2023-03-10T15:00:00.000Z");

    const slots = Clock.slots(60, {
      include: [start, end],
      exclude: [
        ["09:00", "10:00"],
        ["11:00", "12:00"],
        ["13:00", "14:00"],
      ],
    });

    expect(slots).toHaveLength(4);
    expect(slots).toEqual([
      [dayjs("2023-03-10T08:00:00.000Z"), dayjs("2023-03-10T09:00:00.000Z")],
      [dayjs("2023-03-10T10:00:00.000Z"), dayjs("2023-03-10T11:00:00.000Z")],
      [dayjs("2023-03-10T12:00:00.000Z"), dayjs("2023-03-10T13:00:00.000Z")],
      [dayjs("2023-03-10T14:00:00.000Z"), dayjs("2023-03-10T15:00:00.000Z")],
    ]);
  });

  it("Should return 2 slots using exclude property and a different timezone", () => {
    const start = dayjs("2024-06-15T12:00:00.000Z").utcOffset(-120); // UTC-2
    const end = dayjs("2024-06-15T18:00:00.000Z").utcOffset(-120); // UTC-2

    const slots = Clock.slots(120, {
      include: [start, end],
      exclude: [["14:00", "16:00"]],
    });

    expect(slots).toHaveLength(2);
    expect(slots).toEqual([
      [
        dayjs("2024-06-15T12:00:00.000Z").utcOffset(-120),
        dayjs("2024-06-15T14:00:00.000Z").utcOffset(-120),
      ],
      [
        dayjs("2024-06-15T16:00:00.000Z").utcOffset(-120),
        dayjs("2024-06-15T18:00:00.000Z").utcOffset(-120),
      ],
    ]);
  });
});
