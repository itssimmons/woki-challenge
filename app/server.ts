import '@bootstrap/boot';

import build from './app';
import env from './config/env';
import logging from './config/logging';

(async () => {
  const f = await build({
    logger: logging[env('NODE_ENV', 'development')],
  });

  f.listen({ port: 8080 }, (err, address) => {
    if (err) {
      f.log.error(err);
      process.exit(1);
    }

    console.log(`Server listening at ${address}`);
  });
})();
