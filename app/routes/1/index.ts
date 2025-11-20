import { type FastifyPluginCallback } from "fastify";
import WokiController from "../../controllers/woki.controller";

const plugin: FastifyPluginCallback = (f, _opts, done) => {
	f.get("/woki/discover", WokiController.discover);
	f.get("/woki/bookings/day", WokiController.day);
	f.post("/woki/bookings", WokiController.book);
	f.delete("/woki/bookings/:id", WokiController.cancel);
	done();
};

export default plugin;
