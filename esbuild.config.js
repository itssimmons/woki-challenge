import { build } from "esbuild";

build({
	entryPoints: ["app/main.ts"],
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
		"node:*",
		"events",
		"fs",
		"path",
	],
}).catch(() => process.exit(1));
