import { build } from "esbuild";

build({
	entryPoints: ["app/server.ts"],
	outfile: "dist/index.js",
	bundle: true,
	minify: true,
	format: "esm",
	platform: "node",
	tsconfig: "tsconfig.build.json",
	external: [
		"fastify",
		"fastify/*",
		"@fastify/*",
		"ioredis",
		"node:*",
		"events",
		"fs",
		"path",
	],
}).catch(() => process.exit(1));
