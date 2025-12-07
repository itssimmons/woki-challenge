import { FastifyInstance } from 'fastify';

import sqlite from '@database/driver/sqlite';

import build from '../../app/app';

jest.mock('@database/driver/sqlite', () => {
  const original = jest.requireActual('@database/driver/sqlite');
  return {
    __esModule: true,
    ...original,
    default: {
      prepare: jest.fn(),
      exec: jest.fn(),
    },
  };
});

describe('DELETE /1/woki/bookings/:id', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = await build();
    jest.resetAllMocks();
  });

  afterEach(async () => {
    await server.close();
  });

  it('Should cancel at least 1 booking', async () => {
    const mockGet = jest.fn().mockReturnValue({ 1: 1 });
    const mockRun = jest.fn();

    const mockPrepare = (sqlite.prepare as jest.Mock)
      .mockImplementationOnce(() => ({ get: mockGet })) // SELECT 1...
      .mockImplementationOnce(() => ({ run: mockRun })); // UPDATE ...

    const bookingId = 'BK_001';
    const response = await server.inject({
      method: 'DELETE',
      url: `/1/woki/bookings/${bookingId}`,
    });

    expect(mockPrepare).toHaveBeenNthCalledWith(
      1,
      `SELECT 1 FROM bookings WHERE id = ?`
    );
    expect(mockGet).toHaveBeenCalledWith(bookingId);
    expect(mockPrepare).toHaveBeenNthCalledWith(
      2,
      `UPDATE bookings
       SET status = 'CANCELLED', updated_at = DATETIME('now')
       WHERE id = ?`
    );
    expect(mockRun).toHaveBeenCalledWith(bookingId);
    expect(response.statusCode).toStrictEqual(204);
  });

  it("Shouldn't find any booking due to its inexistence", async () => {
    const mockGet = jest.fn().mockReturnValue(undefined);

    const mockPrepare = (sqlite.prepare as jest.Mock).mockImplementationOnce(
      () => ({ get: mockGet })
    ); // SELECT 1...

    const bookingId = 'BK_09X';
    const response = await server.inject({
      method: 'DELETE',
      url: `/1/woki/bookings/${bookingId}`,
    });

    expect(mockPrepare).toHaveBeenNthCalledWith(
      1,
      `SELECT 1 FROM bookings WHERE id = ?`
    );
    expect(mockGet).toHaveBeenCalledWith(bookingId);
    expect(response.statusCode).toStrictEqual(404);
  });
});
