import build from "./app";
import env from "./config/env";
import logging from "./config/logging";
import "@bootstrap/boot";

const f = build({
  logger: logging[env("NODE_ENV", "development")],
});

f.addHook("preHandler", (_, reply, done) => {
  reply.header("x-now", String(performance.now()));
  done();
});

f.listen({ port: 8080 }, (err, address) => {
  if (err) {
    f.log.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);
});
