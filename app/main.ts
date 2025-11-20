import fastify from "fastify";
import logging from "./config/logging";
import env from "./config/env";

const f = fastify({
	logger: logging[env('NODE_ENV', 'development')],
});

f.addHook("preHandler", (_, reply, done) => {
	reply.header("x-now", String(performance.now()));
	done();
});

f.get("/ping", (req, reply) => {
	const headers = reply.getHeaders();

	const now = Number(headers["x-now"]);
	const end = performance.now();
	const elapsed = (end - now).toFixed(3);

	return `Pong in ${elapsed}ms`;
});

f.register(import("./routes/1"), { prefix: "/1" });

f.listen({ port: 8080 }, (err, address) => {
	if (err) {
		f.log.error(err);
		process.exit(1);
	}

	console.log(`Server listening at ${address}`);
});
