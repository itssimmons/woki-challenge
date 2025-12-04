import Clock from '@lib/prototypes/clock';

describe('Clock.offset tests', () => {
  it('Should returns correct UTC offset for each IANA time zone', () => {
    const ianas = new Map<string, string>([
      ['America/Toronto', '-05:00'], // EST
      ['America/Argentina/Buenos_Aires', '-03:00'], // Argentina Time
      ['Europe/Rome', '+01:00'], // CET
      ['Europe/Madrid', '+01:00'], // CET
      ['Europe/Lisbon', '+00:00'], // WET (Western European Time)
      ['Europe/Berlin', '+01:00'], // CET
      ['America/Los_Angeles', '-08:00'], // PST
      ['Pacific/Honolulu', '-10:00'], // Hawaii Standard Time (no DST)
      ['America/Anchorage', '-09:00'], // AKST
      ['Asia/Colombo', '+05:30'], // Sri Lanka
      ['Europe/Skopje', '+01:00'], // CET
      ['Asia/Dhaka', '+06:00'], // Bangladesh
      ['Asia/Tashkent', '+05:00'], // Uzbekistan, no DST
      ['Asia/Almaty', '+05:00'], // Kazakhstan (since 2024 unified to +05)
      ['Indian/Maldives', '+05:00'],
      ['Pacific/Fiji', '+12:00'], // Fiji (can be +13 during DST, currently +12)
      ['Pacific/Tahiti', '-10:00'],
      ['Pacific/Apia', '+13:00'], // Samoa (standard)
      ['Pacific/Majuro', '+12:00'], // Marshall Islands
      ['Pacific/Tarawa', '+12:00'], // Gilbert Islands part of Kiribati
      ['Asia/Kathmandu', '+05:45'], // Nepal
    ]);

    ianas.forEach((expectedOffset, iana) => {
      const offset = Clock.offset(iana);
      expect(offset).toBe(expectedOffset);
    });
  });
});
