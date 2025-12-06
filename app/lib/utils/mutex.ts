import { createClient as createRedisClient } from '@database/driver/redis';
import Exception from '@exceptions/index';

namespace mutex {
  export const IDEMPOTENCY_TTL = 60;
  export const LOCK_TTL = 10;

  export const Lock = async (key: string) => {
    const redis = createRedisClient();
    if (await redis.get(key)) {
      throw new Exception.Mutex('Lock already acquired');
    }

    return {
      async acquire() {
        return await redis.set(key, 'locked', 'EX', LOCK_TTL, 'NX');
      },
      async release() {
        const num = await redis.del(key);
        redis.quit();
        return num;
      },
    };
  };

  export const release = async (key: string) => {
    const redis = createRedisClient();
    const num = await redis.del(key);
    redis.quit();
    return num;
  };
}

export default mutex;
