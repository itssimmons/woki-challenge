import '@bootstrap/boot';

import build from './app';
import env from './config/env';
import logging from './config/logging';

(async () => {
  const f = await build({
    logger: logging[env('NODE_ENV', 'development')],
  });

  f.listen(
    {
      port: Number(env('PORT', 8080)),
      host: env('HOST', '0.0.0.0'),
    },
    (err, address) => {
      if (err) {
        f.log.error(err);
        process.exit(1);
      }

      console.log(`Server listening at ${address}`);
    }
  );
})();
