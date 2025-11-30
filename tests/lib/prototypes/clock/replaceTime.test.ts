import dayjs from "@lib/addons/dayjs";
import Clock from "@lib/prototypes/clock";

describe("Clock.replaceTime tests", () => {
  it("Should replace the time portion of a UTC date with the provided time string", () => {
    const date = dayjs("2023-05-15T10:30:00Z");
    const newTime = "15:45";

    const updatedDate = Clock.replaceTime(date, newTime);
    expect(updatedDate.format()).toBe("2023-05-15T15:45:00Z");
  });

  it("Should replace the time portion of a date in a specific IANA time zone", () => {
    const date = dayjs("2023-05-15T10:30:00-04:00");
    const tz = "America/Toronto";
    const newTime = "20:15";

    const updatedDate = Clock.replaceTime(date, newTime, tz);
    expect(updatedDate.format()).toBe("2023-05-15T20:15:00-04:00");
  });

  it("Should handle time replacement across day boundaries", () => {
    const date = dayjs("2023-05-15T23:30:00+01:00");
    const tz = "Europe/London";
    const newTime = "01:15";

    const updatedDate = Clock.replaceTime(date, newTime, tz);
    expect(updatedDate.format()).toBe("2023-05-15T01:15:00+01:00");
  });
});
