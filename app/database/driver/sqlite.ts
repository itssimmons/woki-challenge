import { DatabaseSync } from 'node:sqlite';

import env from '@config/env';

const ref = { value: new DatabaseSync(env('DB_MEMORY_PATH', ':memory:')) };
ref.value.exec(
  /* sql */ `PRAGMA foreign_keys = ${env('DB_FOREIGN_KEYS', 'ON')};`
);
process.on('exit', () => ref.value.close());

const sqlite = new Proxy(ref, {
  get(target, prop) {
    if (prop === 'inject') {
      return (poison: DatabaseSync) => {
        target.value = poison;
      };
    }

    const value = Reflect.get(target.value, prop);

    if (typeof value === 'function') {
      return value.bind(target.value);
    }

    return value;
  },
}) as unknown as Join<DatabaseSync, { inject: (poison: DatabaseSync) => void }>;

export default sqlite;
