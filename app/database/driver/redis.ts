import Redis from 'ioredis';

import env from '@config/env';

export function createClient() {
  return new Redis({
    host: env('REDIS_HOST', 'localhost'),
    port: Number(env('REDIS_PORT', 6379)),
  });
}
