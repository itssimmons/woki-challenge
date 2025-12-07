import { createClient as createRedisClient } from '@database/driver/redis';
import Exception from '@exceptions/index';

namespace mutex {
  export const IDEMPOTENCY_TTL = 60;
  export const LOCK_TTL = 60;

  export const Lock = async (key: string) => {
    const redis = createRedisClient();

    try {
      const alreadyLocked = await redis.get(key);
      if (alreadyLocked) {
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
    } catch (error) {
      redis.quit();
      throw error;
    }
  };

  export const release = async (key: string) => {
    const redis = createRedisClient();

    try {
      const num = await redis.del(key);
      return num;
    } finally {
      redis.quit();
    }
  };
}

export default mutex;
