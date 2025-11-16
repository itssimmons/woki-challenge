import { type FastifyPluginCallback } from "fastify";

const plugin: FastifyPluginCallback = (f, _opts, done) => {
	f.get("/woki/discover", () => {});
	f.get("/woki/bookings/day", () => {});
	f.post("/woki/bookings", () => {});
	f.delete("/woki/bookings/:id", () => {});
	done();
};

export default plugin;
